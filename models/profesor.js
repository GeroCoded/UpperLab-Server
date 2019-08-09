
var userValidator = require('../controllers/userValidator');

class ProfesorModel {

	constructor( profesor ) {
		this.matricula = profesor.matricula;
		this.nombre = profesor.nombre;
		this.apellidoP = profesor.apellidoP;
		this.apellidoM = profesor.apellidoM;
		this.correo = profesor.correo;
		this.carreras = profesor.carreras;
	}

	validarDatos() {

		if (
			this.matricula == null || 
			this.nombre    == null || 
			this.apellidoP == null || 
			this.apellidoM == null || 
			this.correo    == null    )
		{
			return 1;
		}

		this.transformarDatos();

		return userValidator.validarDatosDelUsuario( this.toJson() );
	}

	transformarDatos( ) {
		this.matricula = this.matricula.toUpperCase();
		this.correo = this.correo.toLowerCase();
	}

	toJson() {
		return {
			matricula: 	this.matricula,
			nombre	 : 	this.nombre,
			apellidoP: 	this.apellidoP,
			apellidoM: 	this.apellidoM,
			correo	 : 	this.correo,
			carreras : 	this.carreras
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

}

module.exports = ProfesorModel;
