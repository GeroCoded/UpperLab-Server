var express = require('express');
var firestore = require('firebase-admin').firestore();
var mdAuthentication = require('./middlewares/authentication');
var LaboratorioModel = require('../models/laboratorio');

var app = express();

const laboratoriosRef = firestore.collection('laboratorios');

// ====================================================== //
// ========= Consultar laboratorio por edificio ========= //
// ====================================================== //
app.get('/edificio/:edificio', mdAuthentication.esAdminOSuper, (req, res)=>{
	
	var laboratorios = [];
	
	var edificio = req.params.edificio.toUpperCase();
	
	// console.log(edificio);
	laboratoriosRef.where('edificio', '==', edificio).get().then( (snapshot ) => {

		if ( snapshot.empty ) {
			return res.status(200).json({
				ok: false,
				message: 'No existe ningún laboratorio en el edificio ' + edificio,
				laboratorios
			});
		}
		
		snapshot.forEach( querySnapshot => {
			laboratorios.push(querySnapshot.data());
		});

		return res.status(200).json({
			ok: true,
			laboratorios
		});
	})
	.catch( err => {
		return res.status(500).json({
			ok: false,
			message: 'Error al buscar laboratorio',
			error: err
		});
	});
});


// ====================================================== //
// ======== Consultar laboratorio por abreviatura ======= //
// ====================================================== //
app.get('/:abreviatura', mdAuthentication.esAdminOSuper, (req, res)=>{
	
	var laboratorio;
	
	var abreviatura = req.params.abreviatura.toUpperCase();

	laboratoriosRef.where('abreviatura', '==', abreviatura).get().then( snapshot => {

		if ( snapshot.empty ) {
			return res.status(200).json({
				ok: false,
				message: 'No existe ningún laboratorio con la abreviatura ' + abreviatura,
			});
		}
		
		snapshot.forEach( querySnapshot => {
			laboratorio = querySnapshot.data();
		});

		return res.status(200).json({
			ok: true,
			laboratorio
		});
	})
	.catch( err => {
		return res.status(500).json({
			ok: false,
			message: 'Error al buscar laboratorio',
			error: err
		});
	});
});




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
	
	laboratoriosRef.where('abreviatura', '==', laboratorio.abreviatura).get().then( snapshot => {

		// console.log('Dentro del Where');
		if ( !snapshot.empty ) {
			// console.log('Dentro del Empty');
			return res.status(400).json({
				ok: false,
				message: 'Ya existe un laboratorio con la abreviatura ' + laboratorio.abreviatura
			});
		}

		// var documentData = laboratorio.toJson();
		
		// // Elimina los campos que son NULL, '', UNDEFINED
		// Object.keys(documentData).forEach(key => {
		// 	if (!documentData[key]) {
		// 	  delete documentData[key];
		// 	}
		// });

		console.log('Antes del add()');
		laboratoriosRef.add(laboratorio.toJson()).then( laboratorioCreado => {
			// console.log('Dentro del Add');
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
	laboratoriosRef.where('abreviatura', '==', laboratorio.abreviaturaVieja).get().then( laboratoriosSnapshotUno => {

		// console.log('Dentro del Where');
		if ( laboratoriosSnapshotUno.empty ) {
			// console.log('Dentro del Empty');
			return res.status(400).json({
				ok: false,
				message: 'No se encontró ningún laboratorio con la abreviatura ' + laboratorio.abreviaturaVieja
			});
		}
		
		if ( laboratoriosSnapshotUno.docs.length > 1 ) {
			// console.log('Dentro del length');
			return res.status(400).json({
				ok: false,
				message: 'Al parecer hay más de 1 laboratorio con la misma abreviatura (' + abreviaturaVieja + '). No se modificó ningún laboratorio',
			});
		}


		// Verificar que no haya otro laboratorio con la nueva abreviatura

		if ( laboratorio.abreviatura != laboratorio.abreviaturaVieja ) {
			// console.log(this.laboratorio);
			laboratoriosRef.where('abreviatura', '==', laboratorio.abreviatura).get().then( laboratoriosSnapshotDos => {

				// console.log('Dentro del Where');
				var batch = firestore.batch();
				
				if ( !laboratoriosSnapshotDos.empty ) {
					// console.log('Dentro del Empty');
					return res.status(400).json({
						ok: false,
						message: 'Ya existe un laboratorio con la abreviatura ' + laboratorio.abreviatura
					});
				}

				// console.log('snapshotDos length: ' + laboratoriosSnapshotDos.docs.length);
				// console.log(laboratorio.toJson());

				laboratoriosSnapshotUno.forEach( (labDos) => {
					// console.log('Dentro del Foreach');
					// For each lab, add a delete operation to the batch
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
						message: 'Error al modificar laboratorio con abreviatura ' + abreviatura,
						error: err
					});
				});
			
			}).catch( err => {
				return res.status(500).json({
					ok: false,
					message: 'Error al verificar existencia de la nueva abreviatura (' + laboratorio.abreviatura + ')',
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
					message: 'Error al modificar laboratorio con abreviatura ' + abreviatura,
					error: err
				});
			});
		

		}

	}).catch( err => {
		return res.status(500).json({
			ok: false,
			message: 'Error al verificar existencia de la vieja abreviatura (' + laboratorio.abreviatura + ')',
			error: err
		});
	});

});




// ====================================================== //
// ================= Eliminar Laboratorio =============== //
// ====================================================== //
app.delete('/:abreviatura', mdAuthentication.esSuperadmin, (req, res) => {
	
	var abreviatura = req.params.abreviatura.toUpperCase();

	laboratoriosRef.where('abreviatura', '==', abreviatura).get().then( (laboratoriosSnapshot) => {

		var batch = firestore.batch();

		if ( laboratoriosSnapshot.empty ) {
			return res.status(400).json({
				ok: false,
				message: 'No se encontró ningún laboratorio con la abreviatura ' + abreviatura,
			});
		}

		if ( laboratoriosSnapshot.docs.length > 1 ) {
			return res.status(400).json({
				ok: false,
				message: 'Al parecer hay más de 1 laboratorio con la misma abreviatura (' + abreviatura + '). No se eliminó ningún laboratorio',
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
				message: 'Error al eliminar laboratorio con abreviatura ' + abreviatura,
				error: err
			});
		});

	}).catch( err => {
		return res.status(500).json({
			ok: false,
			message: 'Error al buscar laboratorio con abreviatura ' + abreviatura,
			error: err
		});
	});

	
});


module.exports = app;
