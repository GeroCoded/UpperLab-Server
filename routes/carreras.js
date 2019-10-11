const express = require('express');

const mdAuthentication = require('./middlewares/authentication');
const carrerasCtrl = require('../controllers/collections/carreras');
const BREAK_MESSAGE = require('../config/config').BREAK_MESSAGE;
const ObjetoResponse = require('../models/objetoResponse');

const app = express();



/**
 * 
 * 	  === Consultar carreras ===
 * 	  [GET] - [/carreras]
 * 
 * 	  === Crear carrera ===
 * 	  [POST] - [/carreras]
 * 
 *	  === Modificar carrera ===
 * 	  [PUT] - [/carreras/:clave]
 * 
 * 	  === Eliminar carrera ===
 *    [DELETE] - [/carreras/:clave]
 * 
 * ----------------------------------------------------------------------------
 * 
 *    === Consultar cuatrimestres de X carrera. === X
 *    [GET] - [/carreras/:clave/cuatrimestres]
 *    Query params: carrera=true|false
 * 
 * 	  === Crear cuatrimestre ===
 * 	  [POST] - [/carreras/:clave/cuatrimestres]
 * 
 *	  === Actualizar X cuatrimestre ===
 * 	  [PUT] - [/carreras/:clave/cuatrimestres/:cuatri]
 * 
 * 	  === Eliminar cuatrimestre ===
 *    [DELETE] - [/carreras/:clave]
 * 
 * ----------------------------------------------------------------------------
 * 
 * 	  === Consultar materias de X carrera en Y cuatrimestre === X
 *    [GET] - [/carreras/:clave/cuatrimestres/:cuatri/materias]
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
	console.log(carrera);

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




// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ CUATRIMESTRES ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ //


// ====================================================== //
// ======= Consultar cuatrimestres de X carrera ========= //
// ====================================================== //
app.get('/:clave/cuatrimestres', mdAuthentication.esAdminOSuper, async (req, res) => {
	console.log('GET - Consultando cuatrimestres de ' + req.params.clave.toUpperCase() + '...');
	var conCarrera = req.query.carrera;
	console.log('conCarrera: ' + conCarrera);
	var respuesta;

	carrerasCtrl.getCuatrimestresDeCarrera( req.params.clave.toUpperCase() ).then( respuesta1 => {
		respuesta = respuesta1;

		if ( !conCarrera || conCarrera !== 'true' ) {
			throw new Error( BREAK_MESSAGE );
		}

		return carrerasCtrl.getCarrera( req.params.clave.toUpperCase() );
	}).then( respuesta2 => {
		respuesta.response.carrera = respuesta2.response.carrera;
		respuesta.consoleLog();
		return res.status( respuesta.code ).json( respuesta.response );
	}).catch( (err) => {
		
		if ( err.message === BREAK_MESSAGE ) {
			respuesta.consoleLog();
			return res.status( respuesta.code ).json( respuesta.response );
		}
		respuesta = new ObjetoResponse( 500, false, 'Internal Server Error', null, null);
		respuesta.consoleLog();
		console.log(err);
		return res.status( respuesta.code ).json( respuesta.response );
	});
});


// ====================================================== //
// ============== Actualizar X cuatrimestre ============= //
// ====================================================== //
app.put('/:clave/cuatrimestres/:cuatri', mdAuthentication.esSuperadmin, (req, res) => {
	console.log('PUT - Actualizando cuatrimestre ' + req.params.cuatri + ' de la carrera ' + req.params.clave + '...');
	carrerasCtrl.actualizarCuatrimestre( req.params.clave, req.params.cuatri, req.body.cuatrimestre).then( respuesta => {
		respuesta.consoleLog();
		return res.status( respuesta.code ).json( respuesta.response );
	}).catch( respuesta => {
		respuesta.consoleLog();
		return res.status( respuesta.code ).json( respuesta.response );
	})
});




// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ MATERIAS ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ //


// ====================================================== //
// == Consultar materias de X carrera en Y cuatrimestre = //
// ====================================================== //
app.get('/:clave/cuatrimestres/:cuatri/materias', mdAuthentication.esAdminOSuper, async (req, res) => {
	console.log('GET - Consultando materias de ' + req.params.clave.toUpperCase() + ' ' + req.params.cuatri + ' ...');
	var respuesta = await carrerasCtrl.getMateriasDeCarreraYCuatri( req.params.clave.toUpperCase(), req.params.cuatri );
	respuesta.consoleLog();
	return res.status(respuesta.code).json(respuesta.response);
});



module.exports = app;
