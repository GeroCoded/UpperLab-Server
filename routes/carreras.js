const express = require('express');

const mdAuthentication = require('./middlewares/authentication');
const carrerasCtrl = require('../controllers/collections/carreras');

const app = express();



/**
 * 
 * 	  === Consultar carreras ===
 * 	  [GET] - [/carreras]
 * 
 *    === Consultar cuatrimestres de X carrera. ===
 *    [GET] - [/carreras/:clave/cuatrimestres]
 * 
 * 	  === Consultar materias de X carrera en Y cuatrimestre ===
 *    [GET] - [/carreras/:clave/cuatrimestres/:cuatri/materias]
 * 
 * 	  === Crear carrera ===
 * 	  [POST] - [/carreras]
 * 
 *	  === Modificar carrera ===
 * 	  [PUT] - [/carreras/:clave]
 * 
 * 	  === Eliminar carrera ===
 *    [DELETE] - [/carreras/:clave]
**/

// ====================================================== //
// ================= Consultar carreras ================= //
// ====================================================== //
app.get('/', mdAuthentication.esAdminOSuper, (req, res) => {
	console.log('GET - Consultando carreras...');

	carrerasCtrl.getCarreras().then( respuesta => {
		respuesta.consoleLog();
		return res.status( respuesta.code ).json( respuesta.response );
	}).catch( respuesta => {
		respuesta.consoleLog();
		return res.status( respuesta.code ).json( respuesta.response );
	});
});

// ====================================================== //
// ======= Consultar cuatrimestres de X carrera ========= //
// ====================================================== //
app.get('/:clave/cuatrimestres', mdAuthentication.esAdminOSuper, async (req, res) => {
	console.log('GET - Consultando cuatrimestres de ' + req.params.clave.toUpperCase() + '...');
	var respuesta = await carrerasCtrl.getCuatrimestresDeCarrera( req.params.clave.toUpperCase() );
	respuesta.consoleLog();
	return res.status(respuesta.code).json(respuesta.response);
});

// ====================================================== //
// == Consultar materias de X carrera en Y cuatrimestre = //
// ====================================================== //
app.get('/:clave/cuatrimestres/:cuatri/materias', mdAuthentication.esAdminOSuper, async (req, res) => {
	console.log('GET - Consultando materias de ' + req.params.clave.toUpperCase() + ' ' + req.params.cuatri + ' ...');
	var respuesta = await carrerasCtrl.getMateriasDeCarreraYCuatri( req.params.clave.toUpperCase(), req.params.cuatri );
	respuesta.consoleLog();
	return res.status(respuesta.code).json(respuesta.response);
});

// ====================================================== //
// ==================== Crear carrera =================== //
// ====================================================== //
app.post('/', mdAuthentication.esSuperadmin, (req, res )=> {
	const carrera = req.body.carrera;
	console.log('POST - Creando carrera ' + carrera.nombre + ' ('+carrera.clave+')');

	carrerasCtrl.crearCarrera(carrera).then( respuesta => {
		respuesta.consoleLog();
		return res.status( respuesta.code ).json( respuesta.response );
	}).catch( respuesta => {
		respuesta.consoleLog();
		return res.status( respuesta.code ).json( respuesta.response );
	});
});

// ====================================================== //
// ================== Modificar carrera ================= //
// ====================================================== //
app.put('/:clave', mdAuthentication.esSuperadmin, (req, res )=> {
	const carrera = req.body.carrera;
	console.log('PUT - Modificando carrera ' + req.params.clave);

	carrerasCtrl.modificarCarrera(req.params.clave, carrera).then( respuesta => {
		respuesta.consoleLog();
		return res.status( respuesta.code ).json( respuesta.response );
	}).catch( respuesta => {
		respuesta.consoleLog();
		return res.status( respuesta.code ).json( respuesta.response );
	});
});

// ====================================================== //
// ================== Eliminar carrera ================== //
// ====================================================== //
app.delete('/:clave', mdAuthentication.esSuperadmin, (req, res )=> {

	console.log('DELETE - Eliminando carrera ' + req.params.clave);

	carrerasCtrl.eliminarCarrera(req.params.clave).then( respuesta => {
		respuesta.consoleLog();
		return res.status( respuesta.code ).json( respuesta.response );
	}).catch( respuesta => {
		respuesta.consoleLog();
		return res.status( respuesta.code ).json( respuesta.response );
	});
});

module.exports = app;
