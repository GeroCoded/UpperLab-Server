var express = require('express');
var firestore = require('firebase-admin').firestore();

var mdAuthentication = require('./middlewares/authentication');
var userCRUD = require('../controllers/userCRUD');
var ObjetoResponse = require('../models/objetoResponse');

var app = express();

const COLECCION = 'alumnos';
const USUARIO_SINGULAR = 'alumno';
const USUARIO_PLURAL = 'alumnos';


const alumnosRef = firestore.collection(COLECCION);

// ====================================================== //
// ============ Consultar alumno por matrícula ========== //
// ====================================================== //
app.get('/:matricula', mdAuthentication.esAdminOSuper, (req, res)=>{
	console.log('Consultando alumno por matricula... ' + req.params.matricula);
	
	var objetoResponse = new ObjetoResponse(500, false, 'Internal Server Error', null, null);
	
	var matricula = req.params.matricula.toUpperCase();

	alumnosRef.doc(matricula).get().then( alumnoDoc => {

		if ( !alumnoDoc.exists ) {
			return res.status(400).json({
				ok: false,
				message: 'No existe ningún alumno con la matrícula ' + matricula,
			});
		}

		return res.status(200).json({
			ok: true,
			alumno: alumnoDoc.data()
		});

	}).catch( err => {
		return res.status(500).json({
			ok: false,
			message: 'Error al buscar alumno',
			error: err
		});
	});
});

// ====================================================== //
// ======= Consultar alumnos por grupo (y carrera) ====== //
// ====================================================== //
app.get('/:generacion/:carrera/:grupo', mdAuthentication.esAdminOSuper, (req, res)=>{
	var gen_carrera_grupo = req.params.generacion + '-' + req.params.carrera + '-' + req.params.grupo;

	alumnosRef.where('grupo', '==', gen_carrera_grupo).get()
	.then( snapshot => {

		var alumnos = [];

		if ( snapshot.empty ) {
			return res.status(200).json({
				ok: true,
				message: 'No existe ningún alumno en el grupo de ' + gen_carrera_grupo,
				alumnos
			});
		}

		snapshot.forEach( alumno => {
			alumnos.push(alumno.data());
		});

		return res.status(200).json({
			ok: true,
			alumnos
		});

	})
	.catch( err => {
		return res.status(500).json({
			ok: false,
			error: err
		});
	});
});

// ====================================================== //
// ================= Crear nuevo Alumno ================= //
// ====================================================== //
app.post('/', mdAuthentication.esAdminOSuper, (req, res)=>{
	userCRUD.crearUsuario(COLECCION, USUARIO_SINGULAR, req, res);
});

// ====================================================== //
// ======== Creación múltiple de Alumnos (Excel) ======== //
// ====================================================== //
app.post('/multiple', mdAuthentication.esAdminOSuper, (req, res)=>{

	userCRUD.crearMultiplesUsuarios( COLECCION, USUARIO_SINGULAR, req, res);

});


// ====================================================== //
// ================== Modificar Alumno ================== //
// ====================================================== //
app.put('/', mdAuthentication.esAdminOSuper, (req, res)=>{

	userCRUD.modificarUsuario(COLECCION, USUARIO_SINGULAR, req, res);

});


// ====================================================== //
// =================== Eliminar Alumno ================== //
// ====================================================== //
app.delete('/:matricula', mdAuthentication.esAdminOSuper, (req, res) => {

	userCRUD.eliminarUsuario(COLECCION, USUARIO_SINGULAR, req, res);

});


module.exports = app;
