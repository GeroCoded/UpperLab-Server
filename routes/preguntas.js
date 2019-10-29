var express = require('express');
var firestore = require('firebase-admin').firestore();
var mdAuthentication = require('./middlewares/authentication');
var ObjetoResponse = require('../models/objetoResponse');

var app = express();


const preguntasRef = firestore.collection('preguntas');



app.get('/', mdAuthentication.esAdminOSuperOAlumnoOProfesor, (req, res)=>{
	console.log('GET - Consultando preguntas... - ');

	var respuesta = new ObjetoResponse(500, false, 'Error al consultar preguntas', null, null);

	var preguntasObj = {};
	var preguntas = [];

	preguntasRef.doc('PREGUNTAS').get().then( documentSnapshot => {

		if ( !documentSnapshot.exists ) {
			respuesta = new ObjetoResponse(200, false, 'No hay ninguna pregunta', { preguntas }, null);
			respuesta.consoleLog();
			return res.status(respuesta.code).json(respuesta.response);	
		}

		preguntasObj = documentSnapshot.data();

		preguntas = preguntasObj.preguntas || [];

		
		respuesta = new ObjetoResponse(200, true, 'Preguntas consultadas exitosamente', { preguntas }, null);
		respuesta.consoleLog();
		return res.status(respuesta.code).json(respuesta.response);	
	}).catch( err => {
		console.log(err);
		respuesta.consoleLog();
		return res.status(respuesta.code).json(respuesta.response);
	});
});



app.put('/', mdAuthentication.esAdminOSuper, (req, res)=>{
	console.log('PUT - Actualizando preguntas... - ');

	var respuesta;

	var preguntas = req.body.preguntas;

	console.log(preguntas);

	preguntasRef.doc('PREGUNTAS').set( { preguntas } ).then( () =>{
		respuesta = new ObjetoResponse( 200, true, 'Preguntas actualizadas correctamente', null, null);
		respuesta.consoleLog();
		return res.status(respuesta.code).json(respuesta.response);	
	}).catch( error => {
		console.log(error);
		respuesta = new ObjetoResponse( 500, false, 'Error al actualizar preguntas', null, null);
		respuesta.consoleLog();
		return res.status(respuesta.code).json(respuesta.response);	
	});
	
});



module.exports = app;