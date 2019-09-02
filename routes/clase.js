var express = require('express');
var firestore = require('firebase-admin').firestore();
var mdAuthentication = require('./middlewares/authentication');
var ClaseModel = require('../models/clase');

var app = express();

const clasesRef = firestore.collection('clases');

// ====================================================== //
// ======== Consultar Clase sin Horario asignado ======== //
// ====================================================== //
app.get('/sinHorario', mdAuthentication.esAdminOSuper, (req, res)=>{
	
	let clases = [];

	clasesRef.where('horario', '==', null).get().then( querySnapshot => {

		if ( querySnapshot.empty ) { 
			return res.status(200).json({
				ok: false,
				message: 'No hay clases sin horarios'
			});
		}

		

		querySnapshot.forEach( queryDocumentSnapshot => {
			clases.push( queryDocumentSnapshot.data() );
		});

		return res.status(200).json({
			ok: true,
			clases
		});
		
	}).catch( err => {
		return res.status(500).json({
			ok: false,
			message: 'Error al buscar clases',
			error: err
		});
	});
		
});


// ====================================================== //
// ================= Crear nueva Clase ================== //
// ====================================================== //
app.post('/', mdAuthentication.esSuperadmin, (req, res)=>{
	
	var clase = new ClaseModel( req.body.clase);
	
	if ( !clase.validarDatos() ) {
		return res.status(400).json({
			ok: false,
			message: 'No se enviaron todos los datos de la clase'
		});
	}

	clase.transformarDatos();

	clasesRef.doc(clase.claseID).get().then( documentSnapshot => {

		if ( documentSnapshot.exists ) {
			return res.status(400).json({
				ok: false,
				message: 'La clase ' + clase.claseID + ' ya existe'
			});
		}
	
		clasesRef.doc(clase.claseID).set( clase.toJson() ).then( () => {
			return res.status(200).json({
				ok: true,
				message: 'Se ha creado la clase con éxito'
			});
		}).catch( err => {
			return res.status(500).json({
				ok: false,
				message: 'Error almacenando clase nueva',
				error: err
			});
		});

	}).catch( err => {
		return res.status(500).json({
			ok: false,
			message: 'Error verificando la existencia de la clase',
			error: err
		});
	});
});




// ====================================================== //
// =================== Modificar Clase ================== //
// ====================================================== //
app.put('/', (req, res) => {
	
	var clase = new ClaseModel( req.body.clase );

	if ( !clase.validarDatos() ) {
		return res.status(400).json({
			ok: false,
			message: 'No se enviaron todos los datos de la clase'
		});
	}

	clase.transformarDatos();

	console.log(clase.toJsonModified());

	clasesRef.doc( clase.claseID ).update( clase.toJsonModified() ).then( () => {

		return res.status(200).json({
			ok: true,
			message: 'Clase modificada con éxito'
		});
		
	}).catch( err => {
		console.log(err);
		return res.status(500).json({
			ok: false,
			message: 'Error al modificar clase',
			error: err
		});
	});

});


// ====================================================== //
// ================ Eliminar Clase por ID =============== //
// ====================================================== //
app.delete('/:claseID', mdAuthentication.esSuperadmin, (req, res) => {
	
	var claseID = req.params.claseID.toUpperCase();

	clasesRef.where('claseID', '==', claseID).get().then( (clasesSnapshot) => {

		var batch = firestore.batch();

		if ( clasesSnapshot.empty ) {
			return res.status(400).json({
				ok: false,
				message: 'No se encontró ninguna clase con el ID ' + claseID,
			});
		}

		if ( clasesSnapshot.docs.length > 1 ) {
			return res.status(400).json({
				ok: false,
				message: 'Al parecer hay más de 1 clase con el mismo ID (' + claseID + '). No se eliminó ninguna clase. Favor de pedirle ayuda al desarrollador.',
			});
		}

		clasesSnapshot.forEach(function(clase) {
            // For each class, add a delete operation to the batch
			batch.delete(clase.ref);
        });
		
        // Commit the batch
		return batch.commit().then( () =>{ 
			return res.status(200).json({
				ok: true,
				message: 'Clase eliminada con éxito'
			});
		}).catch( err => {
			return res.status(500).json({
				ok: false,
				message: 'Error al eliminar clase con el ID ' + claseID,
				error: err
			});
		});

	}).catch( err => {
		return res.status(500).json({
			ok: false,
			message: 'Error al buscar clase con el ID ' + claseID,
			error: err
		});
	});

	
});

module.exports = app;
