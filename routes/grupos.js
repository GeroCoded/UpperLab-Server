var express = require('express');
var mdAuthentication = require('./middlewares/authentication');
var ObjetoResponse = require('../models/objetoResponse');
var gruposCtrl = require('../controllers/collections/grupos');


var app = express();





/**
 * ['GET','/carrera/:carrera']
 * Consultar la colección de grupos por carrera
 */
app.get('/carrera/:carrera', mdAuthentication.esAdminOSuper, async (req, res) => {
	console.log('GET: /grupos/carrera/:carrera - Consultando grupos por carrera...');
	var carrera = req.params.carrera.toUpperCase();
	var activo = req.query.activo;
	
	if ( activo === 'true' ) {
		activo = true;
	} else if ( activo === 'false' ) {
		activo = false;
	}
	
	gruposCtrl.consultarGrupos(activo, carrera).then( respuesta => {
		respuesta.consoleLog();
		return res.status(respuesta.code).json(respuesta.response);
	}).catch( err => {
		console.log(err);
		return new ObjetoResponse(500, false, 'Error inesperado al consultar grupos', null, err);
	});
	
});





/**
 * ['POST','/']
 * Crear nuevo grupo.
 */
app.post('/', mdAuthentication.esAdminOSuper, (req, res) => {
	console.log('POST: /grupos - Creando grupo...');

	var grupo = req.body.grupo;

	if ( grupo.activo === 'true' ) {
		grupo.activo = true;
	} else if ( grupo.activo === 'false' ) {
		grupo.activo = false;
	}

	gruposCtrl.crearGrupo( grupo ).then( respuesta => {
		respuesta.consoleLog();
		return res.status(respuesta.code).json(respuesta.response);
	}).catch( err => {
		console.log(err);
		return new ObjetoResponse(500, false, 'Error inesperado al crear nuevo grupo', null, err);
	});

});






/**
 * ['PUT','/:grupoID']
 * Modificar un grupo mediante su ID, recibiendo TODOS los datos del grupo.
 */
app.put('/:grupoID', mdAuthentication.esAdminOSuper, (req, res) => {
	console.log('PUT: /:grupoID - Modificando grupo...');

	var grupo = req.body.grupo;
	var grupoID = req.params.grupoID;

	if ( grupo.activo === 'true' ) {
		grupo.activo = true;
	} else if ( grupo.activo === 'false' ) {
		grupo.activo = false;
	}

	gruposCtrl.modificarGrupoCompleto( grupoID, req.body.grupo ).then( respuesta => {
		respuesta.consoleLog();
		return res.status(respuesta.code).json(respuesta.response);
	}).catch( err => {
		console.log(err);
		return new ObjetoResponse(500, false, 'Error inesperado al modificar grupo', null, err);
	});

});







/**
 * ['DELETE','/:grupoID']
 * Eliminar grupo
 */
app.delete('/:grupoID', mdAuthentication.esSuperadmin, (req, res) => {
	console.log('DELETE: /grupos/:grupoID - Eliminando grupo ' + req.params.grupoID + '...');
	gruposCtrl.eliminarGrupo( req.params.grupoID ).then( respuesta => {
		respuesta.consoleLog();
		return res.status(respuesta.code).json(respuesta.response);
	}).catch( err => {
		console.log(err);
		return new ObjetoResponse(500, false, 'Error inesperado al eliminar grupo', null, err);
	});

});

module.exports = app;

