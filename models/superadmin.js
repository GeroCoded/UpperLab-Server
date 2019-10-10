
var userValidator = require('../controllers/userValidator');

class SuperadminModel {

	constructor( superadmin ) {
		this.matricula = superadmin.matricula;
		this.nombre = superadmin.nombre;
		this.apellidoP = superadmin.apellidoP;
		this.apellidoM = superadmin.apellidoM;
		this.correo = superadmin.correo;
	}

	validarDatos() {

		if (
			this.matricula === null || 
			this.nombre    === null || 
			this.apellidoP === null || 
			this.apellidoM === null || 
			this.correo    === null    )
		{
			return 1;
		}

		this.transformarDatos();

		return userValidator.validarDatosDelUsuario( this.toJson() );
	}

	transformarDatos( ) {
		this.matricula = this.matricula.toUpperCase();
		this.correo = this.correo.toLowerCase();
		this.nombre = utils.stringsToCamelSpacedCase(this.nombre);
		this.apellidoP = utils.stringsToCamelSpacedCase(this.apellidoP);
		this.apellidoM = utils.stringsToCamelSpacedCase(this.apellidoM);
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
		
		Object.keys(documentData).forEach(key => {
			if (documentData[key] === undefined) {
			  delete documentData[key];
			}
		});

		return documentData;
	}

}

module.exports = SuperadminModel;
