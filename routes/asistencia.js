var express = require('express');
var firestore = require('firebase-admin').firestore();
var mdAuthentication = require('./middlewares/authentication');
var ObjetoResponse = require('../models/objetoResponse');
var BREAK_MESSAGE = require('../config/config').BREAK_MESSAGE;

// Modelos
var ClaseModel = require ('./../models/clase');
var AlumnoModel = require ('./../models/alumno');

// Controller
const asistenciaCtrl = require('../controllers/collections/asistencias');

var app = express();

const clasesRef = firestore.collection('clases');


app.post('/', mdAuthentication.esAlumno, (req, res) => {
	console.log();
	console.log('POST: Registrando asistencia de alumno...');
	var respuesta;

	asistenciaCtrl.agregarAsistencia( req.body.alumno, req.body.codigoQR ).then( respuesta => {
		respuesta.consoleLog();
		return res.status( respuesta.code ).json( respuesta.response );
	}).catch( err => {
		console.log(err);
		respuesta = new ObjetoResponse( 500, false, 'Internal Server Error', null, err );
		respuesta.consoleLog();
		return res.status( respuesta.code ).json( respuesta.response );
	});
	
});


module.exports = app;