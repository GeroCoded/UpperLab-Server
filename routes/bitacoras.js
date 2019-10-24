
const express = require('express');
const app = express();

// Middleware
const mdAuthentication = require('./middlewares/authentication');

// Controllers
const bitacorasCtrl = require('../controllers/collections/bitacoras');

app.get('/usosnoautorizados', /*mdAuthentication.esAdminOSuperOProfesor,*/ (req, res) => {

	bitacorasCtrl.consultarUsosNoAutorizados().then( respuesta => {
		respuesta.consoleLog();
		return res.status(respuesta.code).json(respuesta.response);
	}).catch( respuesta => {
		respuesta.consoleLog();
		return res.status(respuesta.code).json(respuesta.response);
	});
	
});


module.exports = app;
