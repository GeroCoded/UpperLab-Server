
var auth = require ('firebase-admin').auth();

var DOMINIO_CORREO = require('../config/config').DOMINIO_CORREO;

exports.crearCuentaDeUsuario = function crearCuentaDeUsuario( correo, contrasena, displayName ) {

	// DATOS DE PRUEBA
	// TODO: Validar en el frontend que la contraseña sea mayor a 6 y quitar estas lineas.
	var contrasenaLength = contrasena.length;
	if ( contrasenaLength < 6 ) {
		var caracter = contrasena.charAt( contrasenaLength - 1);

		for (let index = 0; index < (6 - contrasenaLength); index++) {
			contrasena += caracter;
		}
	}

	return auth.createUser({ email: correo, password: contrasena, displayName });
};

exports.obtenerCuentaDeUsuarioPorCorreo = function obtenerCuentaDeUsuarioPorEmail( matricula ) {
	return auth.getUserByEmail(matricula + DOMINIO_CORREO);
};

exports.eliminarCuentaDeUsuario = function eliminarCuentaDeUsuario( uid ) {
	return auth.deleteUser(uid);
};

exports.asignarRolAUsuario = function asignarRolAUsuario(uid, atributos) {
	return auth.setCustomUserClaims(uid, atributos);
};

exports.existeCuenta = async function existeCuenta( matricula ) {

	const usuario = await auth.getUserByEmail( matricula + DOMINIO_CORREO);
	if ( usuario.uid == null ) {
		return false;
	}
	return true;
};
