
var firestore = require('firebase-admin').firestore();

var ServerResponse = require('http').ServerResponse;
// var auth = require('firebase-admin').auth();

var authController = require('../controllers/authentication');
var archivosController = require('../controllers/archivos');
var ObjetoResponse = require('../models/objetoResponse');
var AlumnoModel = require('../models/alumno');
var ProfesorModel = require('../models/profesor');
var AdminModel = require('../models/admin');
var SuperadminModel = require('../models/superadmin');

var MENSAJES_DE_ERROR = require('../config/config').MENSAJES_DE_ERROR;
var BREAK_MESSAGE = require('../config/config').BREAK_MESSAGE;


// ====================================================== //
// =========== CONSULTAR A TODOS LOS USUARIOS =========== //
// ====================================================== //
exports.obtenerTodosLosUsuarios = function obtenerTodosLosUsuarios( coleccion, usuarioSingular, res) {

	var usuarios = [];

	var objetoResponse = new ObjetoResponse( 500, false, `Hubo un problema al consultar a los ${ coleccion }`, {usuarios}, null);

	firestore.collection( coleccion ).get().then( querySnapshot => {

		if ( querySnapshot.empty ) {
			objetoResponse = new ObjetoResponse( 200, false, `No hay ningún ${ usuarioSingular } registrado`, {usuarios}, null);
			throw new Error(BREAK_MESSAGE);
		}

		querySnapshot.forEach( usuario => {
			usuario = usuario.data();
			delete usuario.contrasena;
			usuarios.push( usuario );
		});

		objetoResponse = new ObjetoResponse( 200, true, null, {usuarios}, null);
		return res.status(objetoResponse.code).json(objetoResponse.response);

	}).catch( err => {

		if ( err.message !== BREAK_MESSAGE ) {
			console.log(err);
			console.log(objetoResponse.message);
			objetoResponse.error = err;
		}
		return res.status(objetoResponse.code).json(objetoResponse.response);

	});
};





/**
 * Consultar usuario por medio de su matrícula.
 * 
 * @param coleccion Nombre de la colección donde se encuentra el usuario.
 * @param matricula Matrícula del usuario.
 * @param usuarioSingular El tipo de usuario en su forma singular.
 * @return Promesa de la consulta.
 */
exports.consultarUsuarioPorMatricula = function consultarUsuarioPorMatricula( coleccion, matricula, usuarioSingular ) {

	return new Promise( (resolve, reject) => {

		var objetoResponse;

		firestore.collection( coleccion ).doc( matricula ).get().then( documentSnapshot => {

			if ( !documentSnapshot.exists ) {
				objetoResponse = new ObjetoResponse( 400, false, `No existe ningún ${ usuarioSingular } con la matrícula ${ matricula }`, null, null );
				return reject( objetoResponse );
			}

			var usuario = {};
			usuario[usuarioSingular] = documentSnapshot.data();
			objetoResponse = new ObjetoResponse( 200, true, 'Alumno consultado con éxito', usuario, null );
			return resolve( objetoResponse );
			
		}).catch( err => {
			objetoResponse = new ObjetoResponse( 500, false, `Error al buscar ${ usuarioSingular }`, null, err );
			return reject(objetoResponse);
		});
		
	});
}













// ====================================================== //
// ================= Crear nuevo Usuario ================ //
// ====================================================== //
exports.crearUsuario = function crearUsuario( coleccion, usuarioSingular, req, res){
	
	var objetoResponse = new ObjetoResponse(500, false, 'Internal Server Error', null, null);
	
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
	
	if ( numDeError !== 0 ) {
		objetoResponse = new ObjetoResponse(400, false, MENSAJES_DE_ERROR[numDeError], null, null);
		return res.status(objetoResponse.code).json(objetoResponse.response);
	}

	var displayName = usuario.nombre + ' ' + usuario.apellidoP;

	objetoResponse.message = `Ocurrió un error al verificar la existencia del ${ usuarioSingular }`;

	firestore.collection( coleccion ).where('matricula', '==', usuario.matricula).get().then( querySnapshot => {

		if ( !querySnapshot.empty ) {
			objetoResponse = new ObjetoResponse(400, false, `Ya existe un ${ usuarioSingular } con la matricula ${ usuario.matricula }`, null, null);
			throw new Error(BREAK_MESSAGE);
		}

		// Crear registro en Cloud Firestore
		objetoResponse.message = `Ocurrió un error al almacenar al nuevo ${ usuarioSingular }`;
		return firestore.collection( coleccion ).doc( usuario.matricula ).set( usuario.toJson() );
	
	}).then( () => {
		
		objetoResponse = new ObjetoResponse(200, true, `El ${ usuarioSingular } se creó, pero ya existía una cuenta de autenticación con su correo`, null, null);
		return authController.crearCuentaDeUsuario(usuario.correo, usuario.matricula, displayName);

	}).then( cuentaDeUsuario => {

		objetoResponse = new ObjetoResponse(500, false, `Ocurrió un error al asignar el rol del ${ usuarioSingular }`, null, null);
		return authController.asignarRolAUsuario(cuentaDeUsuario.uid, customClaims)

	}).then( () => {
		objetoResponse = new ObjetoResponse(201, true, `El ${ usuarioSingular } se ha creado con éxito`, null, null);
		return res.status(objetoResponse.code).json(objetoResponse.response);


	}).catch( err => {
		if( err.message !== BREAK_MESSAGE ) {
			console.log(err);
			console.log(objetoResponse.message);
			objetoResponse.error = err;
		}
		return res.status(objetoResponse.code).json(objetoResponse.response);

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

			// console.log('usuario.errores.length > 0  (1)');
			if ( usuarioTieneErrores(usuario) ) {
				return resolve(usuario.toJsonExcel());
			}

			// console.log('verificarExistencia');
			await verificarExistencia(coleccion, usuario);

			// console.log('usuario.errores.length > 0  (2)');
			if ( usuarioTieneErrores(usuario) ) {
				return resolve(usuario.toJsonExcel());
			}

			// console.log('crearRegistro');
			await crearRegistro(coleccion, usuario);
			
			// console.log('usuario.errores.length > 0  (3)');
			if ( usuarioTieneErrores(usuario) ) {
				return resolve(usuario.toJsonExcel());
			}

			// console.log('crearCuentaDeUsuario');
			var cuentaDeUsuario = await crearCuentaDeUsuario(usuario);

			if ( usuarioTieneErrores(usuario) ) {
				return resolve(usuario.toJsonExcel());
			}
			// console.log('asignarRolAUsuario');
			await asignarRolAUsuario(usuario, cuentaDeUsuario);

			// console.log('Finalizando...');
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

	var objetoResponse = new ObjetoResponse( 500, false, 'Internal Server Error', null, null );

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

	if ( numDeError !== 0 ) {
		objetoResponse = new ObjetoResponse(400, false, MENSAJES_DE_ERROR[numDeError], null, null);
		return res.status(objetoResponse.code).json(objetoResponse.response);
	}

	objetoResponse.message = `Ocurrió un error al verificar la existencia del ${ usuarioSingular }`;

	firestore.collection( coleccion ).where('matricula', '==', usuario.matricula).get()
	.then( querySnapshot => {

		if ( querySnapshot.empty ) {
			objetoResponse = new ObjetoResponse(400, false, `No existe el ${ usuarioSingular } con la matricula ${ usuario.matricula }`, null, null);
			throw new Error(BREAK_MESSAGE);
		}
		
		documentData = usuario.toJsonModified();

		objetoResponse.message = `Ocurrió un error al actualizar al ${ usuarioSingular }`;
		
		return firestore.collection( coleccion ).doc( usuario.matricula ).set( documentData, {merge: true} );

	}).then( () => {

		objetoResponse = new ObjetoResponse(201, true, `El ${ usuarioSingular } ha sido modificado con éxito`, null, null);
		return res.status(objetoResponse.code).json(objetoResponse.response);

	}).catch( err => {
		
		if ( err.message !== BREAK_MESSAGE ) {
			console.log(err);
			console.log(objetoResponse.message);
			objetoResponse.error = err;
		}
		return res.status(objetoResponse.code).json(objetoResponse.response);

	});

};

















// ======================================================== //
// =================== Eliminar Usuario =================== //
// ======================================================== //
exports.eliminarUsuario = function eliminarUsuario( coleccion, usuarioSingular, req, res) {
	console.log('Eliminando usuario...');

	var objetoResponse = new ObjetoResponse( 500, false, 'Internal Server Error', null, null );
	
	var docSnapshotHolder;
	var matricula = req.params.matricula;
	matricula = matricula.toUpperCase();

	objetoResponse.message = `Error al consultar ${ usuarioSingular } con matricula ${ matricula }`;
	firestore.collection( coleccion ).doc( matricula ).get().then( documentSnapshot => {
		
		docSnapshotHolder = documentSnapshot;

		if ( !documentSnapshot.exists ) {
			objetoResponse = new ObjetoResponse( 400, false, `No se encontró al ${ usuarioSingular } con la matrícula ${ matricula }`, null, null );
			throw new Error(BREAK_MESSAGE);
		}
		
		objetoResponse.message = `Error al eliminar ${ usuarioSingular } con la matrícula ${ matricula }`;
		return firestore.collection( coleccion ).doc( matricula ).delete();
	
	}).then( () => {

		objetoResponse = new ObjetoResponse( 200, false, `El registro del ${ usuarioSingular } se eliminó pero el ${ usuarioSingular } no tenía ninguna cuenta vinculada para autenticarse`, null, null );
		return authController.obtenerCuentaDeUsuarioPorCorreo( matricula );

	}).then( usuario => {

		objetoResponse = new ObjetoResponse( 500, false, `Error al eliminar cuenta de autenticación del ${ usuarioSingular } con matrícula ${ matricula }`, null, null );
		return authController.eliminarCuentaDeUsuario( usuario.uid );

	}).then( () => {

		objetoResponse = new ObjetoResponse( 200, true, `El ${ usuarioSingular } '${ docSnapshotHolder.data().nombre }' ha sido eliminado satisfactoriamente`, null, null );
		return res.status(objetoResponse.code).json(objetoResponse.response);
				
	}).catch( err => {
		if ( err.message !== BREAK_MESSAGE ) {
			console.log(err);
			console.log(objetoResponse.message);
			objetoResponse.error = err;
		}
		return res.status(objetoResponse.code).json(objetoResponse.response);

	});
};


