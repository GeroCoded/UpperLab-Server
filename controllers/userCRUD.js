
var firestore = require('firebase-admin').firestore();
// var auth = require('firebase-admin').auth();

var authController = require('../controllers/authentication');

var AlumnoModel = require('../models/alumno');
var ProfesorModel = require('../models/profesor');
var AdminModel = require('../models/admin');
var SuperadminModel = require('../models/superadmin');

var MENSAJES_DE_ERROR = require('../config/config').MENSAJES_DE_ERROR;


// ====================================================== //
// =========== CONSULTAR A TODOS LOS USUARIOS =========== //
// ====================================================== //
exports.obtenerTodosLosUsuarios = function obtenerTodosLosUsuarios( coleccion, usuarioSingular, res) {

	var usuarios = [];

	firestore.collection( coleccion ).get().then( querySnapshot => {

		if ( querySnapshot.empty ) {
			return res.status(200).json({
				ok: false,
				message: `No hay ningún ${ usuarioSingular } registrado`,
				usuarios
			});
		}

		querySnapshot.forEach( usuario => {
			usuario = usuario.data();
			delete usuario.contrasena;
			usuarios.push( usuario );
		});

		return res.status(200).json({
			ok: true,
			usuarios
		});
	}).catch( err => {
		return res.status(500).json({
			ok: false,
			message: `Hubo un problema al consultar a los ${ coleccion }`,
			usuarios,
			error: err
		});
	});
	
};













// ====================================================== //
// ================= Crear nuevo Usuario ================ //
// ====================================================== //
exports.crearUsuario = function crearUsuario( coleccion, usuarioSingular, req, res){
	
	var usuario;

	var customClaims = {
		isAlumno: false,
		isProfesor: false,
		isAdmin: false,
		isSuperadmin: false
	};

	// Determinar qué tipo de usuario es
	switch ( usuarioSingular ) {
		case 'alumno':
			usuario = new AlumnoModel( req.body.alumno );
			customClaims.isAlumno = true;
			break;
		case 'profesor':
			usuario = new ProfesorModel( req.body.profesor );
			customClaims.isProfesor = true;
			break;
		case 'administrador':
			usuario = new AdminModel( req.body.admin );
			customClaims.isAdmin = true;
			break;
		case 'superadministrador':
			usuario = new SuperadminModel( req.body.superadmin );
			customClaims.isSuperadmin = true;
			break;
	}
	
	var numDeError = usuario.validarDatos();
	
	if ( numDeError != 0 ) {
		return res.status(400).json({
			ok: false,
			message: MENSAJES_DE_ERROR[numDeError]
		});
	}


	firestore.collection( coleccion ).where('matricula', '==', usuario.matricula).get().then( querySnapshot => {

		if ( !querySnapshot.empty ) {
			return res.status(400).json({
				ok: false,
				message: `Ya existe un ${ usuarioSingular } con la matricula ${ usuario.matricula }`
			});
		}

		// Crear registro en Cloud Firestore
		firestore.collection( coleccion ).doc( usuario.matricula ).set( usuario.toJson() ).then( () => {
	
			var displayName = usuario.nombre + ' ' + usuario.apellidoP;
	
			authController.crearCuentaDeUsuario(usuario.correo, usuario.matricula, displayName).then( cuentaDeUsuario => {
				
				authController.asignarRolAUsuario(cuentaDeUsuario.uid, customClaims).then(()=>{
					
					return res.status(201).json({
						ok: true,
						message: `El ${ usuarioSingular } se ha creado con éxito`
					});
					
				}).catch( err => {
					return res.status(500).json({
						ok: true,
						message: `Ocurrió un error al asignar el rol del ${ usuarioSingular }`,
						error: err
					});
				});
				
			})  
			.catch( err => {
				return res.status(400).json({
					ok: true,
					message: `El ${ usuarioSingular } se creó, pero ya existía una cuenta de autenticación con su correo`,
					error: err
				});
			});
		}).catch( err => {
			return res.status(500).json({
				ok: false,
				message: `Ocurrió un error al almacenar al nuevo ${ usuarioSingular }`,
				error: err
			});
		});
	}).catch( err => {
		return res.status(500).json({
			ok: false,
			message: `Ocurrió un error al verificar la existencia del ${ usuarioSingular }`,
			error: err
		});
	});

};













// ====================================================== //
// ================== MODIFICAR USUARIO ================= //
// ====================================================== //
exports.modificarUsuario = function modificarUsuario( coleccion, usuarioSingular, req, res ) {

	var usuario;

	switch ( usuarioSingular ) {
		case 'alumno':
			usuario = new AlumnoModel( req.body.alumno );
			break;
		case 'profesor':
			usuario = new ProfesorModel( req.body.profesor );
			break;
		case 'administrador':
			usuario = new AdminModel( req.body.admin );
			break;
		case 'superadministrador':
			usuario = new SuperadminModel( req.body.superadmin );
			break;
	}

	var numDeError = usuario.validarDatos();

	if ( numDeError != 0 ) {
		return res.status(400).json({
			ok: false,
			message: MENSAJES_DE_ERROR[numDeError]
		});
	}


	firestore.collection( coleccion ).where('matricula', '==', usuario.matricula).get().then( querySnapshot => {

		if ( querySnapshot.empty ) {
			return res.status(400).json({
				ok: false,
				message: `No existe el ${ usuarioSingular } con la matricula ${ usuario.matricula }`
			});
		}
		
		documentData = usuario.toJsonModified();

		firestore.collection( coleccion ).doc( usuario.matricula ).set( documentData, {merge: true} ).then( () => {
	
			return res.status(201).json({
				ok: true,
				message: `El ${ usuarioSingular } ha sido modificado con éxito`
			});
			
		}).catch( err => {
			return res.status(500).json({
				ok: false,
				message: `Ocurrió un error al actualizar al ${ usuarioSingular }`,
				error: err
			});
		});
	}).catch( err => {
		return res.status(500).json({
			ok: false,
			message: `Ocurrió un error al verificar la existencia del ${ usuarioSingular }`,
			error: err
		});
	});

};

















// ======================================================== //
// =================== Eliminar Usuario =================== //
// ======================================================== //
exports.eliminarUsuario = function eliminarUsuario( coleccion, usuarioSingular, req, res) {

	var matricula = req.params.matricula;
	matricula = matricula.toUpperCase();

	firestore.collection( coleccion ).doc( matricula ).get().then( documentSnapshot => {

		if ( !documentSnapshot.exists ) {
			return res.status(400).json({
				ok: false,
				message: `No se encontró al ${ usuarioSingular } con la matrícula ${ matricula }`
			});
		}

		firestore.collection( coleccion ).doc( matricula ).delete().then( () => {
			authController.obtenerCuentaDeUsuarioPorCorreo( matricula ).then( usuario => {
				authController.eliminarCuentaDeUsuario( usuario.uid ).then( () => {
					return res.status(200).json({
						ok: true,
						message: `El ${ usuarioSingular } '${ documentSnapshot.data().nombre }' ha sido eliminado satisfactoriamente`
					});
				}).catch( err => {
					return res.status(500).json({
						ok: false,
						message: `Ocurrió un error al eliminar cuenta de autenticación del ${ usuarioSingular } con matrícula ${ matricula }`,
						error: err
			
					});
				});
			}).catch( err => {
				return res.status(200).json({
					ok: false,
					message: `El registro del ${ usuarioSingular } se eliminó pero, al parecer, el ${ usuarioSingular } no tenía ninguna cuenta vinculada para autenticarse`,
					error: err
				});
			});
		}).catch( err => {
			return res.status(500).json({
				ok: false,
				message: `Ocurrió un error al eliminar registro del ${ usuarioSingular } con matrícula ${ matricula }`,
				error: err
			});
		});
	}).catch( err => {
		return res.status(500).json({
			ok: false,
			message: `Ocurrió un error al buscar al ${ usuarioSingular } con matrícula ${ matricula }`,
			error: err
		});
	});
};


