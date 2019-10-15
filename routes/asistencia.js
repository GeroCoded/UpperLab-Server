var express = require('express');
var firestore = require('firebase-admin').firestore();
var mdAuthentication = require('./middlewares/authentication');
var ObjetoResponse = require('../models/objetoResponse');
var BREAK_MESSAGE = require('../config/config').BREAK_MESSAGE;

// Modelos
var ClaseModel = require ('./../models/clase');
var AlumnoModel = require ('./../models/alumno');
var CodigoQRModel = require ('./../models/codigoQRModel');

// Controller
const asistenciaCtrl = require('../controllers/collections/asistencias');

var app = express();

const clasesRef = firestore.collection('clases');


/**
 * Registrar la asistencia de un alumno.
 * 
 * [POST] - [/]
 * @param alumno 	Body param
 * @param encrypted Body param
 * @param iv 		Body param
 */
app.post('/', mdAuthentication.esAlumno, (req, res) => {
	console.log();
	console.log('POST: Registrando asistencia de alumno...');
	var respuesta;

	asistenciaCtrl.registrarAsistencia( req.body.alumno, req.body.encrypted ).then( respuesta => {
		respuesta.consoleLog();
		return res.status( respuesta.code ).json( respuesta.response );
	}).catch( err => {
		console.log(err);
		respuesta = new ObjetoResponse( 500, false, 'Internal Server Error', null, err );
		respuesta.consoleLog();
		return res.status( respuesta.code ).json( respuesta.response );
	});
	
});


app.post('/encrypt', (req, res) => {
	const json = req.body.data;
	const codigoQRModel = new CodigoQRModel();
	return res.status( 200 ).json({
		encrypted: codigoQRModel.encrypt(json)
	})
});


app.post('/decrypt', (req, res) => {
	const encrypted = req.body.encrypted;
	const codigoQRModel = new CodigoQRModel();
	codigoQRModel.decrypt(encrypted);
	return res.status( 200 ).json({
		decrypted: {
			equipoID: codigoQRModel.equipoID,
			laboratorio: codigoQRModel.laboratorio,
		}
	})
});


module.exports = app;