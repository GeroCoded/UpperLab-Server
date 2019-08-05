
var auth = require ('firebase-admin').auth();

var DOMINIO_CORREO = require('../config/config').DOMINIO_CORREO;

exports.crearCuentaDeUsuario = function crearCuentaDeUsuario( correo, contrasena, displayName ) {
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
