var express = require('express');
var firestore = require('firebase-admin').firestore();
var mdAuthentication = require('./middlewares/authentication');

var userCRUD = require('../controllers/userCRUD');

var app = express();

const COLECCION = 'superadmins';
const USUARIO_SINGULAR = 'superadministrador';
const USUARIO_PLURAL = 'superadministradores';

// ====================================================== //
// =========== Consultar todos los superadmin =========== //
// ====================================================== //
app.get('/', [mdAuthentication.esSuperadmin], (req, res)=>{
	
	return userCRUD.obtenerTodosLosUsuarios(COLECCION, USUARIO_SINGULAR, res);

});

// ========================================================== //
// ============ Consultar superadmin por matrícula ========== //
// ========================================================== //
app.get('/:matricula', mdAuthentication.esSuperadmin, (req, res)=>{
	
	var matricula = req.params.matricula.toUpperCase();

	firestore.collection(COLECCION).doc(matricula).get()
	.then( superadminDoc => {
	
		if ( !superadminDoc.exists ) {
			return res.status(200).json({
				ok: false,
				message: 'No existe ningún superadministrador con la matrícula ' + matricula,
			});
		}

		var superadmin = superadminDoc.data();
		delete superadmin.contrasena;

		return res.status(200).json({
			ok: true,
			superadmin
		});
	})
	.catch( err => {
		return res.status(500).json({
			ok: false,
			message: 'Error al buscar superadministrador',
			error: err
		});
	});
});

// ====================================================== //
// ================ Crear nuevo Superadmin ============== //
// ====================================================== //
app.post('/', mdAuthentication.esSuperadmin, (req, res)=>{

	return userCRUD.crearUsuario(COLECCION, USUARIO_SINGULAR, req, res);

});

// ========================================================== //
// ================== Modificar Superadmin ================== //
// ========================================================== //
app.put('/', mdAuthentication.esSuperadmin, (req, res)=>{

	return userCRUD.modificarUsuario(COLECCION, USUARIO_SINGULAR, req, res);

});

// ====================================================== //
// ================ Eliminar Superadmin ================= //
// ====================================================== //
app.delete('/:matricula', mdAuthentication.esSuperadmin, (req, res) => {

	return userCRUD.eliminarUsuario(COLECCION, USUARIO_SINGULAR, req, res);

});

module.exports = app;
