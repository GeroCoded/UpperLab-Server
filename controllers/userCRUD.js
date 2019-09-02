
var firestore = require('firebase-admin').firestore();

var ServerResponse = require('http').ServerResponse;
// var auth = require('firebase-admin').auth();

var authController = require('../controllers/authentication');
var archivosController = require('../controllers/archivos');

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




exports.crearMultiplesUsuarios = function crearMultiplesUsuarios( coleccion, usuarioSingular, req, res){

	// Obtención del archivo excel subido por el administrador
	var excel = archivosController.obtenerArchivoExcel(req, res);

	if ( excel instanceof ServerResponse ) {
		return excel;
	}

	// Validación de los registros del archivo Excel
	var usuariosData = archivosController.validarUsuariosDeExcel( excel, usuarioSingular, res );

	if ( usuariosData instanceof ServerResponse ) {
		return usuariosData;
	}

	// console.log(usuariosData);

	var promesas = [];

	// Pushear promesas al arreglo.
	usuariosData.forEach( usuario => {
		promesas.push( validarUsuario(coleccion, usuario) );
	});

	// Ejecutar todas las promesas, es decir, Validar todos los usuarios al mismo tiempo.
	Promise.all( promesas ).then( (respuestas) => {
		// console.log(' OOOOOOOOOOO  ========== Respuestas buenas =========== OOOOOOOOOO');
		// console.log(respuestas);
		// console.log(' XXXXXXXXXXX  ============ USUARIOSDATA ============== XXXXXXXXXX');
		// console.log(usuariosData);
		
		return res.status(200).json({
			ok: true,
			respuestas
		});
	}).catch( err => {
		return res.status(500).json({
			ok: false,
			// usuariosData,
			error: err
		});
	});
	
};


function validarUsuario(coleccion, usuario) {

	return new Promise( async (resolve, reject) => {
		try {

			console.log('usuario.errores.length > 0  (1)');
			if ( usuarioTieneErrores(usuario) ) {
				return resolve(usuario.toJsonExcel());
			}

			console.log('verificarExistencia');
			await verificarExistencia(coleccion, usuario);

			console.log('usuario.errores.length > 0  (2)');
			if ( usuarioTieneErrores(usuario) ) {
				return resolve(usuario.toJsonExcel());
			}

			console.log('crearRegistro');
			await crearRegistro(coleccion, usuario);
			
			console.log('usuario.errores.length > 0  (3)');
			if ( usuarioTieneErrores(usuario) ) {
				return resolve(usuario.toJsonExcel());
			}

			console.log('crearCuentaDeUsuario');
			var cuentaDeUsuario = await crearCuentaDeUsuario(usuario);

			if ( usuarioTieneErrores(usuario) ) {
				return resolve(usuario.toJsonExcel());
			}
			console.log('asignarRolAUsuario');
			await asignarRolAUsuario(usuario, cuentaDeUsuario);

			console.log('Finalizando...');
			return resolve(usuario.toJsonExcel());
			
			
		} catch( err ) {
			console.log('Error... ', err);
			return reject(err);
		}
	});
}

function usuarioTieneErrores( usuario ) {
	if ( usuario.errores.length > 0  || usuario.warning.length > 0 ) {
		return true;
	}
	return false;
}


function verificarExistencia( coleccion, usuario ) {

	return new Promise( (resolve, reject) => {
		firestore.collection( coleccion ).where('matricula', '==', usuario.matricula).get().then( querySnapshot => {
			
			if ( !querySnapshot.empty ) {
				usuario.errores.push('Ya existe la matrícula');
			}
			return resolve();

		}).catch( err => {
			usuario.errores.push('Error al verificar existencia: ' + err);
			return resolve(err);
		});
	});
	
}

function crearRegistro( coleccion, usuario ) {
	return new Promise( (resolve, reject) => {
		firestore.collection( coleccion ).doc( usuario.matricula ).set( usuario.toJson() ).then( () => {
			return resolve();
		}).catch( err => {
			usuario.errores.push('Error al almacenar registro');
			return resolve(err);
		});
	});
}

function crearCuentaDeUsuario( usuario ) {
	return new Promise( (resolve, reject) => {
		var displayName = usuario.nombre + ' ' + usuario.apellidoP;
		authController.crearCuentaDeUsuario(usuario.correo, usuario.matricula, displayName).then( (cuentaDeUsuario) => {
			return resolve(cuentaDeUsuario);
		}).catch( err => {
			usuario.warning.push( `Ya existía una cuenta de autenticación con ese correo ${ err }` );
			return resolve(err);
		});
	});
}

function asignarRolAUsuario( usuario, cuentaDeUsuario ) {
	return new Promise( (resolve, reject) => {
		authController.asignarRolAUsuario(cuentaDeUsuario.uid, usuario.customClaims).then( () => { 
			return resolve();
		}).catch( err => {
			usuario.errores.push(`Error al asignar el rol`);
			return resolve(err);
		});
	});
}








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


