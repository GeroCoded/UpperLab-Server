var express = require('express');

// Firestore
const { getBD, COLECCIONES } = require('../config/config');
const adminsName = COLECCIONES.admins;
const firestore = getBD( adminsName );

// Referencias de Firestore 
const adminsRef = firestore.collection(adminsName);

var mdAuthentication = require('./middlewares/authentication');

var userCRUD = require('../controllers/userCRUD');

var app = express();

const COLECCION = COLECCIONES.admins;
const USUARIO_SINGULAR = 'administrador';
const USUARIO_PLURAL = 'administradores';


// ====================================================== //
// ============== Consultar todos los admin ============= //
// ====================================================== //
app.get('/', mdAuthentication.esAdminOSuper, (req, res)=>{

	return userCRUD.obtenerTodosLosUsuarios(COLECCION, USUARIO_SINGULAR, res);
	
});




// ====================================================== //
// ============ Consultar admin por matrícula =========== //
// ====================================================== //
app.get('/:matricula', mdAuthentication.esAdminOSuper, (req, res)=>{
	
	var matricula = req.params.matricula.toUpperCase();

	adminsRef.doc(matricula).get().then( adminDoc => {

		if ( !adminDoc.exists ) {
			return res.status(200).json({
				ok: false,
				message: 'No existe ningún admin con la matrícula ' + matricula,
			});
		}

		var admin = adminDoc.data();
		delete admin.contrasena;

		return res.status(200).json({
			ok: true,
			admin
		});
	})
	.catch( err => {
		return res.status(500).json({
			ok: false,
			message: 'Error al buscar admin',
			error: err
		});
	});
});




// ====================================================== //
// ================= Crear nuevo Admin ================= //
// ====================================================== //
app.post('/', mdAuthentication.esSuperadmin, (req, res)=>{
	
	return userCRUD.crearUsuario(COLECCION, USUARIO_SINGULAR, req, res);

});


// ========================================================== //
// ================= Modificar Admin ================= //
// ========================================================== //
app.put('/', mdAuthentication.esSuperadmin, (req, res)=>{
	
	return userCRUD.modificarUsuario(COLECCION, USUARIO_SINGULAR, req, res);

});


// ====================================================== //
// =================== Eliminar Admin =================== //
// ====================================================== //
app.delete('/:matricula', mdAuthentication.esSuperadmin, (req, res) => {
	
	return userCRUD.eliminarUsuario(COLECCION, USUARIO_SINGULAR, req, res);

});

module.exports = app;
