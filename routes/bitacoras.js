
const express = require('express');
const app = express();

// Middleware
const mdAuthentication = require('./middlewares/authentication');

// Controllers
const bitacorasCtrl = require('../controllers/collections/bitacoras');

app.get('/usosnoautorizados', mdAuthentication.esAdminOSuperOProfesor, (req, res) => {

	bitacorasCtrl.consultarUsosNoAutorizados().then( respuesta => {
		respuesta.consoleLog();
		return res.status(respuesta.code).json(respuesta.response);
	}).catch( respuesta => {
		respuesta.consoleLog();
		return res.status(respuesta.code).json(respuesta.response);
	});
	
});

app.get('/formato/practicas', mdAuthentication.esAdminOSuperOProfesor, (req, res) => {

	bitacorasCtrl.consultarFormatoDePracticas().then( respuesta => {
		respuesta.consoleLog();
		return res.status(respuesta.code).json(respuesta.response);
	}).catch( respuesta => {
		respuesta.consoleLog();
		return res.status(respuesta.code).json(respuesta.response);
	});
	
});

app.put('/formato/practicas', mdAuthentication.esAdminOSuperOProfesor, (req, res) => {

	bitacorasCtrl.actualizarFormatoDePracticas(req.body.inputs).then( respuesta => {
		respuesta.consoleLog();
		return res.status(respuesta.code).json(respuesta.response);
	}).catch( respuesta => {
		respuesta.consoleLog();
		return res.status(respuesta.code).json(respuesta.response);
	});
	
});

// Consultas las prácticas registradas.
app.get('/practicas', mdAuthentication.esAdminOSuperOProfesor, (req, res) => {

	bitacorasCtrl.consultarPracticas().then( respuesta => {
		respuesta.consoleLog();
		return res.status(respuesta.code).json(respuesta.response);
	}).catch( respuesta => {
		respuesta.consoleLog();
		return res.status(respuesta.code).json(respuesta.response);
	});
	
});

app.post('/practicas', mdAuthentication.esProfesor, (req, res) => {

	bitacorasCtrl.registrarPractica(req.body.registro).then( respuesta => {
		respuesta.consoleLog();
		return res.status(respuesta.code).json(respuesta.response);
	}).catch( respuesta => {
		respuesta.consoleLog();
		return res.status(respuesta.code).json(respuesta.response);
	});
	
});


module.exports = app;
