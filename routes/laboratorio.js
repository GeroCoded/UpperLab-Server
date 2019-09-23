var express = require('express');
var firestore = require('firebase-admin').firestore();
var mdAuthentication = require('./middlewares/authentication');
var resgen = require('../controllers/responseGenerator');
var LaboratorioModel = require('../models/laboratorio');

var app = express();

const laboratoriosRef = firestore.collection('laboratorios');

// ====================================================== //
// ========= Consultar laboratorio por edificio ========= //
// ====================================================== //
app.get('/edificio/:edificio',/* mdAuthentication.esAdminOSuper,*/ (req, res)=>{
	
	var edificio = req.params.edificio.toUpperCase();

	getLaboratoriosPorCampo( 'edificio', edificio, true ).then( objetoRespuesta => {
		return res.status(objetoRespuesta.code).json(objetoRespuesta.response);
	}).catch( objetoRespuesta => {
		return res.status(objetoRespuesta.code).json(objetoRespuesta.response);
	});
		
});


// ====================================================== //
// =========== Consultar laboratorio por clave ========== //
// ====================================================== //
app.get('/:clave', mdAuthentication.esAdminOSuper, (req, res)=>{
	
	var clave = req.params.clave.toUpperCase();

	getLaboratoriosPorCampo( 'clave', clave, false ).then( objetoRespuesta => {
		return res.status(objetoRespuesta.code).json(objetoRespuesta.response);
	}).catch( objetoRespuesta => {
		return res.status(objetoRespuesta.code).json(objetoRespuesta.response);
	});
	
});


function getLaboratoriosPorCampo( campo, valor, masculino ) {

	var objetoRespuesta;

	return new Promise( (resolve, reject) => {
		laboratoriosRef.where(campo, '==', valor).get().then( snapshot => {

			if ( snapshot.empty ) {
				var message = `No existe ningún laboratorio con ${ (masculino ? ' el ' : ' la ') } ${campo} ${valor}`;
				// message += (masculino ? ' el ' : ' la ') + campo + ' ' + valor;
				
				objetoRespuesta = resgen.getResponse(200, false, message, null, null);
				return resolve(objetoRespuesta);
			}
			
			var laboratorios = [];
			var i = 0;

			snapshot.forEach( querySnapshot => {
				// laboratorios = querySnapshot.data();
				laboratorios.push(querySnapshot.data());
				laboratorios[i].id = querySnapshot.id;
				i++;
			});
	
			objetoRespuesta = resgen.getResponse(200, true, null, {laboratorios}, null);

			return resolve(objetoRespuesta);
		})
		.catch( err => {
			objetoRespuesta = resgen.getResponse(500, false, 'Error al buscar laboratorio', null, err);

			return reject(objetoRespuesta);
		});
	});
	
}




// ====================================================== //
// ============== Crear nuevo Laboratorio =============== //
// ====================================================== //
app.post('/', mdAuthentication.esSuperadmin, (req, res)=>{
	
	var laboratorio = new LaboratorioModel( req.body.laboratorio);

	if ( !laboratorio.validarDatos(false) ) {
		// console.log('if');
		return res.status(400).json({
			ok: false,
			message: 'No se enviaron todos los datos del laboratorio'
		});
	}

	laboratorio.transformarDatos();
	
	laboratoriosRef.where('clave', '==', laboratorio.clave).get().then( snapshot => {

		if ( !snapshot.empty ) {
			return res.status(400).json({
				ok: false,
				message: 'Ya existe un laboratorio con la clave ' + laboratorio.clave
			});
		}

		laboratoriosRef.add(laboratorio.toJson()).then( laboratorioCreado => {
			return res.status(201).json({
				ok: true,
				message: 'Laboratorio creado con éxito.',
				laboratorioId: laboratorioCreado.id
			});
			
		}).catch( err => {
			return res.status(500).json({
				ok: false,
				message: 'Error almacenando nuevo laboratorio',
				error: err
			});
		});
	}).catch( err => {
		return res.status(500).json({
			ok: false,
			message: 'Error al verificar existencia',
			error: err
		});
	});

});




// ========================================================== //
// ================= Modificar Laboratorio ================== //
// ========================================================== //
app.put('/', mdAuthentication.esSuperadmin, (req, res)=>{

	var laboratorio = new LaboratorioModel( req.body.laboratorio );

	if ( !laboratorio.validarDatos() ) {
		return res.status(400).json({
			ok: false,
			message: 'No se enviaron todos los datos del laboratorio'
		});
	}

	laboratorio.transformarDatos();

	// console.log(laboratorio);
	// console.log('json...');
	// console.log(laboratorio.toJson());
	
	// Verificar que sí exista el laboratorio que se modificará
	laboratoriosRef.where('clave', '==', laboratorio.claveVieja).get().then( laboratoriosSnapshotUno => {

		// console.log('Dentro del Where');
		if ( laboratoriosSnapshotUno.empty ) {
			// console.log('Dentro del Empty');
			return res.status(400).json({
				ok: false,
				message: 'No se encontró ningún laboratorio con la clave ' + laboratorio.claveVieja
			});
		}
		
		if ( laboratoriosSnapshotUno.docs.length > 1 ) {
			// console.log('Dentro del length');
			return res.status(400).json({
				ok: false,
				message: 'Al parecer hay más de 1 laboratorio con la misma clave (' + claveVieja + '). No se modificó ningún laboratorio. Favor de pedirle ayuda al desarrollador.',
			});
		}


		// Verificar que no haya otro laboratorio con la nueva clave

		if ( laboratorio.clave != laboratorio.claveVieja ) {
			// console.log(this.laboratorio);
			laboratoriosRef.where('clave', '==', laboratorio.clave).get().then( laboratoriosSnapshotDos => {

				// console.log('Dentro del Where');
				var batch = firestore.batch();
				
				if ( !laboratoriosSnapshotDos.empty ) {
					// console.log('Dentro del Empty');
					return res.status(400).json({
						ok: false,
						message: 'Ya existe un laboratorio con la clave ' + laboratorio.clave
					});
				}

				// console.log('snapshotDos length: ' + laboratoriosSnapshotDos.docs.length);
				// console.log(laboratorio.toJson());

				laboratoriosSnapshotUno.forEach( (labDos) => {
					// console.log('Dentro del Foreach');
					// For each lab, add an update operation to the batch
					batch.update(labDos.ref, laboratorio.toJson());
				});


				// console.log('Antes del commit');
				// Commit the batch
				return batch.commit().then( () =>{ 
					// console.log('Dentro del Commit');
					return res.status(200).json({
						ok: true,
						message: 'Laboratorio modificado con éxito'
					});
				}).catch( err => {
					return res.status(500).json({
						ok: false,
						message: 'Error al modificar laboratorio con clave ' + clave,
						error: err
					});
				});
			
			}).catch( err => {
				return res.status(500).json({
					ok: false,
					message: 'Error al verificar existencia de la nueva clave (' + laboratorio.clave + ')',
					error: err
				});
			});
		} else {

			var batch = firestore.batch();

			laboratoriosSnapshotUno.forEach(function(lab) {
				// console.log('Dentro del Foreach');
				// For each lab, add a delete operation to the batch
				batch.update(lab.ref, laboratorio.toJson());
			});


			// console.log('Antes del commit');
			// Commit the batch
			return batch.commit().then( () =>{ 
				// console.log('Dentro del Commit');
				return res.status(200).json({
					ok: true,
					message: 'Laboratorio modificado con éxito'
				});
			}).catch( err => {
				return res.status(500).json({
					ok: false,
					message: 'Error al modificar laboratorio con clave ' + clave,
					error: err
				});
			});
		

		}

	}).catch( err => {
		return res.status(500).json({
			ok: false,
			message: 'Error al verificar existencia de la vieja clave (' + laboratorio.clave + ')',
			error: err
		});
	});

});




// ====================================================== //
// ================= Eliminar Laboratorio =============== //
// ====================================================== //
app.delete('/:clave', mdAuthentication.esSuperadmin, (req, res) => {
	
	var clave = req.params.clave.toUpperCase();

	laboratoriosRef.where('clave', '==', clave).get().then( (laboratoriosSnapshot) => {

		var batch = firestore.batch();

		if ( laboratoriosSnapshot.empty ) {
			return res.status(400).json({
				ok: false,
				message: 'No se encontró ningún laboratorio con la clave ' + clave,
			});
		}

		if ( laboratoriosSnapshot.docs.length > 1 ) {
			return res.status(400).json({
				ok: false,
				message: 'Al parecer hay más de 1 laboratorio con la misma clave (' + clave + '). No se eliminó ningún laboratorio. Favor de pedirle ayuda al desarrollador.',
			});
		}

		laboratoriosSnapshot.forEach(function(lab) {
            // For each lab, add a delete operation to the batch
			batch.delete(lab.ref);
        });
		
        // Commit the batch
		return batch.commit().then( () =>{ 
			return res.status(200).json({
				ok: true,
				message: 'Laboratorio eliminado con éxito'
			});
		}).catch( err => {
			return res.status(500).json({
				ok: false,
				message: 'Error al eliminar laboratorio con la clave ' + clave,
				error: err
			});
		});

	}).catch( err => {
		return res.status(500).json({
			ok: false,
			message: 'Error al buscar laboratorio con la clave ' + clave,
			error: err
		});
	});

	
});


module.exports = app;
