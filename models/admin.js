
var userValidator = require('../controllers/userValidator');

class AdminModel {

	constructor( admin ) {
		this.matricula = admin.matricula;
		this.nombre = admin.nombre;
		this.apellidoP = admin.apellidoP;
		this.apellidoM = admin.apellidoM;
		this.correo = admin.correo;
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
		};
	}

	toJsonModified() {
		
		var documentData = this.toJson();
		
		delete documentData.matricula;
		delete documentData.correo;
		
		// Eliminar los campos que sean UNDEFINED
		Object.keys(documentData).forEach(key => {
			if (documentData[key] === undefined) {
			  delete documentData[key];
			}
		});

		return documentData;
	}

}

module.exports = AdminModel;
