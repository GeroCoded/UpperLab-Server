
var DOMINIO_CORREO = require('../config/config').DOMINIO_CORREO;

exports.validarMatriculaYCorreo = function validarMatriculaYCorreo( matricula, correo ) {
	var correoPartido = correo.split('@');
	return matricula.toLowerCase() === correoPartido[0];
};

exports.validarDominioDelCorreo = function validarDominioDelCorreo( correo ) {
	var correoPartido = correo.split('@');
	return '@'+correoPartido[1] === DOMINIO_CORREO;
};

