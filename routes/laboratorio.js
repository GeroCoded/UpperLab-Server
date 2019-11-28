var express = require('express');
var mdAuthentication = require('./middlewares/authentication');
var ObjetoResponse = require('../models/objetoResponse');
var BREAK_MESSAGE = require('../config/config').BREAK_MESSAGE;
var LaboratorioModel = require('../models/laboratorio');

var app = express();

// Firestore
const { getBD, COLECCIONES } = require('../config/config');
const laboratoriosName = COLECCIONES.laboratorios;
const firestore = getBD( laboratoriosName );

// Referencias de Firestore 
const laboratoriosRef = firestore.collection(laboratoriosName);

// ====================================================== //
// ========= Consultar laboratorio por edificio ========= //
// ====================================================== //
app.get('/edificio/:edificio', mdAuthentication.esAdminOSuper, (req, res)=>{
	
	var edificio = req.params.edificio.toUpperCase();

	getLaboratoriosPorCampo( 'edificio', edificio, true ).then( objetoResponse => {
		return res.status(objetoResponse.code).json(objetoResponse.response);
	}).catch( objetoResponse => {
		return res.status(objetoResponse.code).json(objetoResponse.response);
	});
		
});


// ====================================================== //
// ========== Consultar todos los laboratorios ========== //
// ====================================================== //
app.get('/', mdAuthentication.esAdminOSuperOProfesor, (req, res)=>{

	console.log('GET - Consultando todos los laboratorios...');
	var respuesta;
	var laboratorios = [];

	laboratoriosRef.get().then( querySnapshot => {

		if ( querySnapshot.empty ) {
			respuesta = new ObjetoResponse(200, true, 'No hay laboratorios registrados', {laboratorios}, null);
			return res.status(respuesta.code).json(respuesta.response);
		}

		querySnapshot.forEach( laboratorio => {
			laboratorios.push( laboratorio.data() );
		});

		respuesta = new ObjetoResponse(200, true, 'Laboratorios consultados con éxito', {laboratorios}, null);		
		return res.status(respuesta.code).json(respuesta.response);
	}).catch( err => {
		respuesta = new ObjetoResponse(500, false, 'Error al consultar todos los laboratorios', {laboratorios}, err);
		return res.status(respuesta.code).json(respuesta.response);
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
			objetoResponse = new ObjetoResponse(400, false, 'Al parecer hay más de 1 laboratorio con la misma clave (' + laboratorio.claveVieja + '). No se modificó ningún laboratorio. Favor de pedirle ayuda al desarrollador.', null, null);
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
		objetoResponse.message = 'Error al modificar laboratorio con clave ' + laboratorio.clave;
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


// ====================================================== //
// ============ Actualizar Horas Disponibles ============ //
// ====================================================== //
app.put('/horasDisponibles', mdAuthentication.esAdminOSuper, (req, res) => {

	var respuesta;

	const id = req.body.id;
	const horasDisponibles = req.body.horasDisponibles;
	
	if ( !id ) {

		respuesta = new ObjetoResponse(400, false, 'No se envió el id del laboratorio', null, null);
		return res.status( respuesta.code ).json( respuesta.response );

	} else if ( !horasDisponibles ) {

		respuesta = new ObjetoResponse(400, false, 'No se enviaron las horas disponibles del laboratorio', null, null);
		return res.status( respuesta.code ).json( respuesta.response );
	}

	laboratoriosRef.doc( id ).update({ horasDisponibles }).then( () => {

		respuesta = new ObjetoResponse(200, true, `Horas disponibles actualizadas con éxito`, null, null);
		return res.status( respuesta.code ).json( respuesta.response );		

	}).catch( error => {

		console.log(error);
		respuesta = new ObjetoResponse(404, false, `El laboratorio enviado no existe`, null, null);
		return res.status( respuesta.code ).json( respuesta.response );
	});
});


// ====================================================== //
// ============= Consultar Horas Disponibles ============ //
// ====================================================== //
app.get('/:clave/horasDisponibles',/* mdAuthentication.esAdminOSuper,*/ (req, res) => {

	var respuesta;
	var horasDisponibles;
	const clave = req.params.clave;
	
	
	if ( !clave ) {

		respuesta = new ObjetoResponse(400, false, 'No se envió la clave del laboratorio', null, null);
		return res.status( respuesta.code ).json( respuesta.response );

	}

	laboratoriosRef.where( 'clave', '==', clave ).get().then( (querySnapshot) => {

		if ( querySnapshot.empty ) {
			respuesta = new ObjetoResponse(404, false, `Laboratorio con la clave ${clave} no encontrado.`, null, null);
			return res.status( respuesta.code ).json( respuesta.response );
		}

		querySnapshot.forEach( laboratorio => {
			horasDisponibles = laboratorio.data().horasDisponibles || {};
		});
		
		respuesta = new ObjetoResponse(200, true, `Horas disponibles actualizadas con éxito`, { horasDisponibles }, null);
		return res.status( respuesta.code ).json( respuesta.response );		

	}).catch( error => {

		console.log(error);
		respuesta = new ObjetoResponse(404, false, `El laboratorio enviado no existe`, null, null);
		return res.status( respuesta.code ).json( respuesta.response );
	});
});



module.exports = app;
