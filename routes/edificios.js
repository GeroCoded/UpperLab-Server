var express = require('express');
var mdAuthentication = require('./middlewares/authentication');
var edificiosCtrl = require('../controllers/collections/edificios');

var app = express();

// ====================================================== //
// ============ Consultar todos los edificios =========== //
// ====================================================== //
app.get('/', mdAuthentication.esAdminOSuper, (req, res)=>{
	console.log('GET: /edificios - Consultando edificios...');

	edificiosCtrl.consultarEdificios().then( respuesta => {
		respuesta.consoleLog();
		return res.status( respuesta.code ).json( respuesta.response );
	}).catch( respuesta => {
		respuesta.consoleLog();
		return res.status( respuesta.code ).json( respuesta.response );
	});
});



/**
 * ['POST','/']
 * Crear nuevo edificio.
 */
app.post('/', mdAuthentication.esAdminOSuper, (req, res) => {
	console.log('POST: /edificios - Creando edificio...');

	edificiosCtrl.crearEdificio( req.body.edificio ).then( respuesta => {
		respuesta.consoleLog();
		return res.status(respuesta.code).json(respuesta.response);
	}).catch( err => {
		console.log(err);
		return new ObjetoResponse(500, false, 'Error inesperado al crear nuevo edificio', null, err);
	});

});





/**
 * ['DELETE','/:clave']
 * Eliminar edificio.
 */
app.delete('/:clave', mdAuthentication.esSuperadmin, (req, res) => {
	console.log('DELETE: /edificios/:clave - Eliminando edificio ' + req.params.clave + '...');
	edificiosCtrl.eliminarEdificio( req.params.clave ).then( respuesta => {
		respuesta.consoleLog();
		return res.status(respuesta.code).json(respuesta.response);
	}).catch( err => {
		console.log(err);
		return new ObjetoResponse(500, false, 'Error inesperado al eliminar edificio', null, err);
	});

});



module.exports = app;
