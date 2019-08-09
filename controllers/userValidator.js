
var DOMINIO_CORREO = require('../config/config').DOMINIO_CORREO;
var MENSAJES_DE_ERROR = require('../config/config').MENSAJES_DE_ERROR;

exports.validarMatriculaYCorreo = function validarMatriculaYCorreo( matricula, correo ) {
	var correoPartido = correo.split('@');
	return matricula.toLowerCase() === correoPartido[0];
};

exports.validarDominioDelCorreo = function validarDominioDelCorreo( correo ) {
	var correoPartido = correo.split('@');
	return '@'+correoPartido[1] === DOMINIO_CORREO;
};

exports.validarDatosDelUsuario = function validarDatosDelUsuario( usuario ) {

	if ( !this.validarDominioDelCorreo( usuario.correo ) ) {
		return 2;
	}

	if ( !this.validarMatriculaYCorreo( usuario.matricula, usuario.correo ) ) {
		return 3;
	}

	return 0;
};

