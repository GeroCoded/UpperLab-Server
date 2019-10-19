const express = require('express');

const mdAuthentication = require('./middlewares/authentication');
const clasificacionesCtrl = require('../controllers/collections/clasificaciones');

const app = express();


/**
 * 	  === Consultar clasificaciones ===
 * 	  [GET] - [/clasificaciones]
 * 
 *    === Actualizar toda la colección de clasificaciones ===
 * 	  [PUT] - [/clasificaciones]
 * 
 * 	  === Actualizar 1 documetno de clasificaciones ===
 * 	  [PUT] - [/clasificaciones/:tipo]
 */


app.get('/', mdAuthentication.esAdminOSuperOAlumno, (req, res) => {
	clasificacionesCtrl.getClasificaciones().then( respuesta => {
		return res.status( respuesta.code ).json( respuesta.response );
	}).catch( respuesta => {
		return res.status( respuesta.code ).json( respuesta.response );
	});
});


// app.put('/', /*mdAuthentication.esAdmin,*/ (req, res) => {
// 	console.log('PUT - Actualizando todas las clasificaciones');
// 	clasificacionesCtrl.updateClasificaciones(req.body.clasificaciones).then( respuesta => {
// 		respuesta.consoleLog();
// 		return res.status( respuesta.code ).json( respuesta.response );
// 	}).catch( respuesta => {
// 		respuesta.consoleLog();
// 		return res.status( respuesta.code ).json( respuesta.response );
// 	});
// });

app.put('/tipo/:tipo', /*mdAuthentication.esAdmin,*/ (req, res) => {
	console.log('PUT - Actualizar clasificación de tipo ' + req.params.tipo);
	console.log(req.params.tipo);
	console.log(req.body.document);
	clasificacionesCtrl.updateTipoDeClasificacion(req.body.document, req.params.tipo).then( respuesta => {
		respuesta.consoleLog();
		return res.status( respuesta.code ).json( respuesta.response );
	}).catch( respuesta => {
		respuesta.consoleLog();
		return res.status( respuesta.code ).json( respuesta.response );
	});
});



module.exports = app;

