var express = require('express');
var firestore = require('firebase-admin').firestore();
var mdAuthentication = require('./middlewares/authentication');

var userCRUD = require('../controllers/userCRUD');

var app = express();

const COLECCION = 'profesores';
const USUARIO_SINGULAR = 'profesor';
const USUARIO_PLURAL = 'profesores';

const profesoresRef = firestore.collection('profesores');

// ====================================================== //
// ============ Consultar profesor por matrícula ========== //
// ====================================================== //
app.get('/:matricula', mdAuthentication.esAdminOSuperOProfesor, (req, res)=>{
	
	var matricula = req.params.matricula.toUpperCase();

	profesoresRef.doc(matricula).get()
	.then( profesorDoc => {

		if ( !profesorDoc.exists ) {
			return res.status(400).json({
				ok: false,
				message: 'No existe ningún profesor con la matrícula ' + matricula,
			});
		}

		var profesor = profesorDoc.data();
		delete profesor.contrasena;

		return res.status(200).json({
			ok: true,
			profesor
		});
	})
	.catch( err => {
		return res.status(500).json({
			ok: false,
			message: 'Error al buscar profesor',
			error: err
		});
	});
});




// ====================================================== //
// ========== Consultar profesores por carrera ========== //
// ====================================================== //
app.get('/carrera/:carrera', mdAuthentication.esAdminOSuper, (req, res)=>{
	
	var carrera = req.params.carrera;

	profesoresRef.where(`carreras.${ carrera }`, '==', true).get()
	.then( snapshot => {

		var profesores = [];

		if ( snapshot.empty ) {
			return res.status(200).json({
				ok: true,
				message: 'No existe ningún profesor en la carrera de ' + carrera,
				profesores
			});
		}

		var profesorSinContrasena;
		
		snapshot.forEach( profesor => {
			profesorSinContrasena = profesor.data();
			delete profesorSinContrasena.contrasena;
			profesores.push(profesorSinContrasena);
		});

		return res.status(200).json({
			ok: true,
			profesores
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
// ========== Consultar todos los profesores ============ //
// ====================================================== //
app.get('/', mdAuthentication.esAdminOSuper, (req, res)=>{

	return userCRUD.obtenerTodosLosUsuarios(COLECCION, USUARIO_SINGULAR, res);

});




// ====================================================== //
// ================ Crear nuevo Profesor ================ //
// ====================================================== //
app.post('/', mdAuthentication.esSuperadmin, (req, res)=>{

	return userCRUD.crearUsuario(COLECCION, USUARIO_SINGULAR, req, res);

});


// ====================================================== //
// ======= Creación múltiple de Profesores (Excel) ====== //
// ====================================================== //
app.post('/multiple', mdAuthentication.esAdminOSuper, (req, res)=>{

	return userCRUD.crearMultiplesUsuarios( COLECCION, USUARIO_SINGULAR, req, res);

});



// ====================================================== //
// ================= Modificar Profesor ================= //
// ====================================================== //
app.put('/', mdAuthentication.esSuperadmin, (req, res)=>{

	return userCRUD.modificarUsuario(COLECCION, USUARIO_SINGULAR, req, res);

});


// ====================================================== //
// =================== Eliminar Profesor ================== //
// ====================================================== //
app.delete('/:matricula', mdAuthentication.esSuperadmin, (req, res) => {

	return userCRUD.eliminarUsuario(COLECCION, USUARIO_SINGULAR, req, res);

});

module.exports = app;
