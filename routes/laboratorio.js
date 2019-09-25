var express = require('express');
var firestore = require('firebase-admin').firestore();
var mdAuthentication = require('./middlewares/authentication');
var ObjetoResponse = require('../models/objetoResponse');
var BREAK_MESSAGE = require('../config/config').BREAK_MESSAGE;
var LaboratorioModel = require('../models/laboratorio');

var app = express();

const laboratoriosRef = firestore.collection('laboratorios');

// ====================================================== //
// ========= Consultar laboratorio por edificio ========= //
// ====================================================== //
app.get('/edificio/:edificio',/* mdAuthentication.esAdminOSuper,*/ (req, res)=>{
	
	var edificio = req.params.edificio.toUpperCase();

	getLaboratoriosPorCampo( 'edificio', edificio, true ).then( objetoResponse => {
		return res.status(objetoResponse.code).json(objetoResponse.response);
	}).catch( objetoResponse => {
		return res.status(objetoResponse.code).json(objetoResponse.response);
	});
		
});


// ====================================================== //
// =========== Consultar laboratorio por clave ========== //
// ====================================================== //
app.get('/:clave', mdAuthentication.esAdminOSuper, (req, res)=>{
	
	var clave = req.params.clave.toUpperCase();

	getLaboratoriosPorCampo( 'clave', clave, false ).then( objetoResponse => {
		return res.status(objetoResponse.code).json(objetoResponse.response);
	}).catch( objetoResponse => {
		return res.status(objetoResponse.code).json(objetoResponse.response);
	});
	
});


function getLaboratoriosPorCampo( campo, valor, masculino ) {

	return new Promise( (resolve, reject) => {
		laboratoriosRef.where(campo, '==', valor).get().then( snapshot => {

			if ( snapshot.empty ) {
				var message = `No existe ningún laboratorio con ${ (masculino ? ' el ' : ' la ') } ${campo} ${valor}`;
				
				
				return resolve( new ObjetoResponse(200, false, message, null, null) );
			}
			
			var laboratorios = [];
			var i = 0;

			snapshot.forEach( querySnapshot => {
				// laboratorios = querySnapshot.data();
				laboratorios.push(querySnapshot.data());
				laboratorios[i].id = querySnapshot.id;
				i++;
			});
	
			return resolve( new ObjetoResponse(200, true, null, {laboratorios}, null) );
		})
		.catch( err => reject(new ObjetoResponse(500, false, 'Error al buscar laboratorio', null, err)) );
	});
}




// ====================================================== //
// ============== Crear nuevo Laboratorio =============== //
// ====================================================== //
app.post('/', mdAuthentication.esSuperadmin, (req, res)=>{

	var objetoResponse = new ObjetoResponse(500, false, 'Internal Server Error', null, null);
	
	var laboratorio = new LaboratorioModel( req.body.laboratorio);

	if ( !laboratorio.validarDatos(false) ) {
		objetoResponse = new ObjetoResponse(400, false, 'No se enviaron todos los datos del laboratorio', null, null);
		return res.status(objetoResponse.code).json(objetoResponse.response);
	}

	laboratorio.transformarDatos();
	
	objetoResponse.message = 'Error al verificar existencia';
	laboratoriosRef.where('clave', '==', laboratorio.clave).get().then( snapshot => {

		if ( !snapshot.empty ) {
			objetoResponse = new ObjetoResponse(400, false, 'Ya existe un laboratorio con la clave ' + laboratorio.clave, null, null);
			throw new Error(BREAK_MESSAGE);
		}

		objetoResponse.message = 'Error almacenando nuevo laboratorio';
		return laboratoriosRef.add(laboratorio.toJson());

	}).then( laboratorioCreado => {

		objetoResponse = new ObjetoResponse(201, true, 'Laboratorio creado con éxito', {laboratorioId: laboratorioCreado.id}, null);
		return res.status(objetoResponse.code).json(objetoResponse.response);
		
	}).catch( err => {

		if ( err.message !== BREAK_MESSAGE ) {
			objetoResponse.error = err;
			console.log(err);
			console.log(objetoResponse.message);
		}
		return res.status(objetoResponse.code).json(objetoResponse.response);
		
	});

});




// ========================================================== //
// ================= Modificar Laboratorio ================== //
// ========================================================== //
app.put('/', mdAuthentication.esSuperadmin, (req, res)=>{

	var objetoResponse = new ObjetoResponse(500, false, 'Internal Server Error', null, null);

	var laboratorio = new LaboratorioModel( req.body.laboratorio );

	if ( !laboratorio.validarDatos() ) {
		objetoResponse = new ObjetoResponse(400, false, 'No se enviaron todos los datos del laboratorio', null, null);
		return res.status(objetoResponse.code).json(objetoResponse.response);
	}

	laboratorio.transformarDatos();

	objetoResponse.message = 'Error al verificar existencia del laboratorio (' + laboratorio.claveVieja + ')';
	
	// Verificar que sí exista el laboratorio que se modificará
	laboratoriosRef.where('clave', '==', laboratorio.claveVieja).get()
	.then( async laboratoriosSnapshotUno => {

		// ¿Existe el laboratorio?
		if ( laboratoriosSnapshotUno.empty ) {
			objetoResponse = new ObjetoResponse(400, false, 'No se encontró ningún laboratorio con la clave ' + laboratorio.claveVieja, null, null);
			throw new Error(BREAK_MESSAGE);
		}
		
		if ( laboratoriosSnapshotUno.docs.length > 1 ) {
			objetoResponse = new ObjetoResponse(400, false, 'Al parecer hay más de 1 laboratorio con la misma clave (' + claveVieja + '). No se modificó ningún laboratorio. Favor de pedirle ayuda al desarrollador.', null, null);
			throw new Error(BREAK_MESSAGE);
		}


		// Si se modificó la clave del laboratorio...
		if ( laboratorio.clave !== laboratorio.claveVieja ) {
			// ...verificar que no exista un laboratorio con la nueva clave
			
			objetoResponse.message = 'Error al verificar existencia de laboratorio con la nueva clave (' + laboratorio.clave + ')';

			var laboratoriosSnapshotDos = await laboratoriosRef.where('clave', '==', laboratorio.clave).get();

			// ¿Ya está ocupada la nueva clave?
			if ( !laboratoriosSnapshotDos.empty ) {
				objetoResponse = new ObjetoResponse(400, false, 'Ya existe un laboratorio con la clave ' + laboratorio.clave, null, null);
				throw new Error(BREAK_MESSAGE);
			}
		}

		var batch = firestore.batch();

		laboratoriosSnapshotUno.forEach( (lab) => {
			// For each lab, add an update operation to the batch
			batch.update(lab.ref, laboratorio.toJson());
		});

		// Commit the batch
		objetoResponse.message = 'Error al modificar laboratorio con clave ' + clave;
		return batch.commit();

	}).then( () => {

		objetoResponse = new ObjetoResponse(200, true, 'Laboratorio modificado con éxito', null, null);
		return res.status(objetoResponse.code).json(objetoResponse.response);

	}).catch( err => {
		if ( err.message !== BREAK_MESSAGE ) {
			objetoResponse.error = err;
			console.log(err);
			console.log(objetoResponse.message);
		}
		return res.status(objetoResponse.code).json(objetoResponse.response);
	});

});




// ====================================================== //
// ================= Eliminar Laboratorio =============== //
// ====================================================== //
app.delete('/:clave', mdAuthentication.esSuperadmin, (req, res) => {
	
	var objetoResponse = new ObjetoResponse(500, false, 'Internal Server Error', null, null);

	var clave = req.params.clave.toUpperCase();

	objetoResponse.message = 'Error al buscar laboratorio con la clave ' + clave;

	laboratoriosRef.where('clave', '==', clave).get()
	.then( laboratoriosSnapshot => {

		var batch = firestore.batch();

		if ( laboratoriosSnapshot.empty ) {
			objetoResponse = new ObjetoResponse(400, false, 'No se encontró ningún laboratorio con la clave ' + clave, null, null);
			throw new Error(BREAK_MESSAGE);
		}

		if ( laboratoriosSnapshot.docs.length > 1 ) {
			objetoResponse = new ObjetoResponse(400, false, 'Al parecer hay más de 1 laboratorio con la misma clave (' + clave + '). No se eliminó ningún laboratorio. Favor de pedirle ayuda al desarrollador.', null, null);
			throw new Error(BREAK_MESSAGE);
		}

		laboratoriosSnapshot.forEach( lab => {
            // For each lab, add a delete operation to the batch
			batch.delete(lab.ref);
        });
		
		// Commit the batch
		objetoResponse.message = 'Error al eliminar laboratorio con la clave ' + clave;
		return batch.commit();

	}).then( () => {

		objetoResponse = new ObjetoResponse(200, true, 'Laboratorio eliminado con éxito', null, null);
		return res.status(objetoResponse.code).json(objetoResponse.response);

	}).catch( err => {
		if ( err.message !== BREAK_MESSAGE ) {
			objetoResponse.error = err;
			console.log(err);
			console.log(objetoResponse.message);
		}
		return res.status(objetoResponse.code).json(objetoResponse.response);
	});

	
});


module.exports = app;
