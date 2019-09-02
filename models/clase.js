
class ClaseModel {

	constructor( clase ) {
		
		this.claseID = clase.claseID;
		this.tipo = clase.tipo;
		this.grupoID = clase.grupoID;
		this.materiaID = clase.materiaID;
		this.materia = clase.materia;
		this.profesorID = clase.profesorID;
		this.profesor = clase.profesor;
		this.configuracion = clase.configuracion;
		this.horario = clase.horario;
	}

	validarDatos() {

		// Campos requeridos
		if (this.claseID 	== null || 
			this.tipo 		== null || 
			this.grupoID	== null ||
			this.materiaID 	== null ||
			this.materia 	== null ||
			this.profesorID == null	||
			this.profesor 	== null ){
			return false;
		}
		return true;
	}

	transformarDatos() {
		this.claseID = this.claseID.toUpperCase();
		this.grupoID = this.grupoID.toUpperCase();
		this.materiaID = this.materiaID.toUpperCase();
		this.profesorID = this.profesorID.toUpperCase();
	}

	toJson() {
		return {
			claseID			: this.claseID,
			tipo			: this.tipo,
			grupoID			: this.grupoID,
			materiaID		: this.materiaID,
			materia			: this.materia,
			profesorID		: this.profesorID,
			profesor		: this.profesor,
			configuracion	: this.configuracion,
			horario	: this.horario
		};
	}


	toJsonModified() {
		return {
			profesorID		: this.profesorID,
			profesor		: this.profesor
		};
	}

}

module.exports = ClaseModel;
