
var DOMINIO_CORREO = require('../config/config').DOMINIO_CORREO;

exports.validarMatriculaYCorreo = function validarMatriculaYCorreo( matricula, correo ) {
	var correoPartido = correo.split('@');
	return matricula === correoPartido[0];
};

exports.validarDominioDelCorreo = function validarDominioDelCorreo( correo ) {
	var correoPartido = correo.split('@');
	return '@'+correoPartido[1] === DOMINIO_CORREO;
};

exports.validarDatosDelUsuario = function validarDatosDelUsuario( usuario, res ) {

	if ( usuario == null || usuario.matricula == null || usuario.correo == null ) {
		return res.status(400).json({
			ok: false,
			message: 'No se enviaron los datos completos.'
		});
	}

	usuario.matricula = usuario.matricula.toLowerCase();
	usuario.correo = usuario.correo.toLowerCase();

	if ( !this.validarDominioDelCorreo( usuario.correo ) ) {
		return res.status(400).json({
			ok: false,
			message: 'El correo no pertenece a la Universidad Politécnica del Estado de Morelos.'
		});
	}

	if ( !this.validarMatriculaYCorreo( usuario.matricula, usuario.correo ) ) {
		return res.status(400).json({
			ok: false,
			message: 'La matrícula y el correo no coinciden'
		});
	}
	
};

