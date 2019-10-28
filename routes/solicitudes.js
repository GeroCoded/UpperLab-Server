var express = require('express');
var firestore = require('firebase-admin').firestore();
var mdAuthentication = require('./middlewares/authentication');
var ObjetoResponse = require('../models/objetoResponse');

var app = express();


const solicitudesRef = firestore.collection('solicitudes');



app.get('/', mdAuthentication.esAdminOSuper, (req, res)=>{
	console.log('GET - Consultando solicitudes... - ');

	var respuesta = new ObjetoResponse(500, false, 'Error al consultar solicitudes', null, null);

	var solicitudes = [];

	solicitudesRef.get().then( querySnapshot => {

		if ( querySnapshot.empty ) {
			respuesta = new ObjetoResponse(200, false, 'No hay ninguna solicitud', { solicitudes }, null);
			respuesta.consoleLog();
			return res.status(respuesta.code).json(respuesta.response);	
		}

		var i = 0;

		querySnapshot.forEach( solicitud => {
			solicitudes.push(solicitud.data());
			solicitudes[i].id = solicitud.id;
			i++;
		});

		
		respuesta = new ObjetoResponse(200, true, 'Solicitudes consultadas exitosamente', { solicitudes }, null);
		respuesta.consoleLog();
		return res.status(respuesta.code).json(respuesta.response);	
	}).catch( err => {
		console.log(err);
		respuesta.error = err;
		respuesta.consoleLog();
		return res.status(respuesta.code).json(respuesta.response);
	});
});




app.get('/:matricula', mdAuthentication.esAdminOSuperOAlumnoOProfesor, (req, res)=>{
	console.log('GET - Consultandosolicitud... - ');
	var matricula = req.params.matricula;
	console.log(matricula);

	var respuesta = new ObjetoResponse(500, false, 'Error al consultar solicitudes', null, null);

	var solicitudes = [];

	solicitudesRef.where( 'usuario.matricula', '==', matricula ).get().then( querySnapshot => {

		if ( querySnapshot.empty ) {
			respuesta = new ObjetoResponse(200, false, 'No hay ninguna solicitud del usuario ' + matricula, { solicitudes }, null);
			respuesta.consoleLog();
			return res.status(respuesta.code).json(respuesta.response);	
		}

		var i = 0;

		querySnapshot.forEach( solicitud => {
			solicitudes.push(solicitud.data());
			solicitudes[i].id = solicitud.id;
			i++;
		});

		
		respuesta = new ObjetoResponse(200, false, 'Solicitudes del usuario ' + matricula + ' consultadas exitosamente', { solicitudes }, null);
		respuesta.consoleLog();
		return res.status(respuesta.code).json(respuesta.response);	
	}).catch( err => {
		console.log(err);
		respuesta.error = err;
		respuesta.consoleLog();
		return res.status(respuesta.code).json(respuesta.response);
	});
});




// ====================================================== //
// =================== CREAR SOLICITUD ================== //
// ====================================================== //
app.post('/', mdAuthentication.esAlumnoOProfesor, (req, res)=>{
	console.log('  - Creando solicitud... - ');
	var solicitud = req.body.solicitud;
	console.log(solicitud);

	var respuesta = new ObjetoResponse(500, false, 'Error al crear solicitud', null, null);

	solicitudesRef.add( solicitud ).then( docReference => {
		respuesta = new ObjetoResponse(201, true, 'Solicitud creada', null, null);
		respuesta.consoleLog();
		return res.status(respuesta.code).json(respuesta.response);
	}).catch( err => {
		console.log(err);
		respuesta.error = err;
		respuesta.consoleLog();
		return res.status(respuesta.code).json(respuesta.response);
	});
});




// ====================================================== //
// ================== ACTUALIZAR ESTADO ================= //
// ====================================================== //
app.put('/estado/:id', mdAuthentication.esAdminOSuper, (req, res) => {
	console.log('PUT - Actualizando estado de solicitud');

	var respuesta;
	var id = req.params.id;
	var estado = req.body.estado;
	var data = { estado };

	solicitudesRef.doc( id ).update( data ).then( () => {
		respuesta = new ObjetoResponse(200, true, `Estado de la solicitud actualizado`, null, null);
		respuesta.consoleLog();
		return res.status(respuesta.code).json(respuesta.response);
	}).catch( error => {
		console.log(error);
		respuesta = new ObjetoResponse(404, false, `La solicitud con el id ${ id } no existe`, null, null);
		respuesta.consoleLog();
		return res.status(respuesta.code).json(respuesta.response);
	});
});




module.exports = app;