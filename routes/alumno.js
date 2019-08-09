var express = require('express');

var firestore = require('firebase-admin').firestore();

var mdAuthentication = require('./middlewares/authentication');
var userCRUD = require('../controllers/userCRUD');

var app = express();

// De 292 líneas a 119 líneas

const COLECCION = 'alumnos';
const USUARIO_SINGULAR = 'alumno';
const USUARIO_PLURAL = 'alumnos';


const alumnosRef = firestore.collection(COLECCION);

// ====================================================== //
// ============ Consultar alumno por matrícula ========== //
// ====================================================== //
app.get('/:matricula', mdAuthentication.esAdminOSuper, (req, res)=>{
	
	var matricula = req.params.matricula.toUpperCase();

	alumnosRef.doc(matricula).get()
	.then( alumnoDoc => {

		if ( !alumnoDoc.exists ) {
			return res.status(200).json({
				ok: false,
				message: 'No existe ningún alumno con la matrícula ' + matricula,
			});
		}

		return res.status(200).json({
			ok: true,
			alumno: alumnoDoc.data()
		});

	})
	.catch( err => {
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
app.get('/:carrera/:grupo', mdAuthentication.esAdminOSuper, (req, res)=>{
	
	var carrera_grupo = req.params.carrera + '-' + req.params.grupo;

	alumnosRef.where('grupo', '==', carrera_grupo).get()
	.then( snapshot => {

		var alumnos = [];

		if ( snapshot.empty ) {
			return res.status(200).json({
				ok: true,
				message: 'No existe ningún alumno en el grupo de ' + carrera_grupo,
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
	
	return userCRUD.crearUsuario(COLECCION, USUARIO_SINGULAR, req, res);

});


// ========================================================== //
// ==================== Modificar Alumno ==================== //
// ========================================================== //
app.put('/', mdAuthentication.esAdminOSuper, (req, res)=>{

	return userCRUD.modificarUsuario(COLECCION, USUARIO_SINGULAR, req, res);

});


// ====================================================== //
// =================== Eliminar Alumno ================== //
// ====================================================== //
app.delete('/:matricula', mdAuthentication.esAdminOSuper, (req, res) => {

	return userCRUD.eliminarUsuario(COLECCION, USUARIO_SINGULAR, req, res);

});

module.exports = app;
