
var userValidator = require('../controllers/userValidator');
var utils = require('../controllers/utils');


class AlumnoModel {

	constructor( alumno, desdeExcel ) {
		this.matricula = alumno.matricula;
		this.nombre = alumno.nombre;
		this.apellidoP = alumno.apellidoP;
		this.apellidoM = alumno.apellidoM;
		this.correo = alumno.correo;

		if ( alumno.asistencias ) {
			this.asistencias = alumno.asistencias;
		} else {
			this.asistencias = {};
		}
		
		if ( desdeExcel ) {
			this.grupo = alumno.generacion + '-' + alumno.carrera +'-' + alumno.grupo;
		} else {
			this.grupo = alumno.grupo;
		}

		this.customClaims = null;
		this.errores = [];
		this.warning = [];
	}

	validarDatos() {

		if (
			this.matricula === null || 
			this.nombre    === null || 
			this.apellidoP === null || 
			this.apellidoM === null || 
			this.correo    === null || 
			this.grupo     === null    )
		{
			return 1;
		}

		this.transformarDatos();

		return userValidator.validarDatosDelUsuario( this.toJson() );
	}

	transformarDatos( ) {
		this.matricula = this.matricula.toUpperCase();
		this.correo = this.correo.toLowerCase();
		this.grupo = this.grupo.toUpperCase();
		this.nombre = utils.stringsACamelSpacedCase(this.nombre);
		this.apellidoP = utils.stringsACamelSpacedCase(this.apellidoP);
		this.apellidoM = utils.stringsACamelSpacedCase(this.apellidoM);
	}

	toJson() {
		return {
			matricula  : 	this.matricula,
			nombre	   : 	this.nombre,
			apellidoP  : 	this.apellidoP,
			apellidoM  : 	this.apellidoM,
			correo	   : 	this.correo,
			grupo	   : 	this.grupo,
			asistencias:    this.asistencias
		};
	}

	toJsonModified() {
		
		var documentData = this.toJson();
		
		delete documentData.matricula;
		delete documentData.correo;
		
		Object.keys(documentData).forEach(key => {
			if (documentData[key] === undefined) {
			  delete documentData[key];
			}
		});

		return documentData;
	}

	toJsonExcel() {
		return {
			matricula: 	this.matricula,
			nombre	 : 	this.nombre,
			apellidoP: 	this.apellidoP,
			apellidoM: 	this.apellidoM,
			correo	 : 	this.correo,
			grupo	 : 	this.grupo,
			// customClaims	 : 	this.customClaims,
			errores	 : 	this.errores,
			warning	 : 	this.warning
		};
	}

}

module.exports = AlumnoModel;
