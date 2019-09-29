
class ClaseModel {

	constructor( clase ) {
		
		this.claseID = clase.claseID;
		this.tipo = clase.tipo;
		this.grupoID = clase.grupoID;
		this.carreraID = clase.carreraID;
		this.cuatrimestre = clase.cuatrimestre;
		this.materiaID = clase.materiaID;
		this.materia = clase.materia;
		this.profesorID = clase.profesorID;
		this.profesor = clase.profesor;
		this.laboratorios = clase.laboratorios;
		this.dias = clase.dias;
		this.configuracion = clase.configuracion;
		this.horario = clase.horario;
		this.alumnos = clase.alumnos;
	}

	validarDatos() {

		// Campos requeridos
		if (this.claseID 	  === null || 
			this.tipo 		  === null || 
			this.grupoID	  === null ||
			this.carreraID	  === null ||
			this.cuatrimestre === null ||
			this.materiaID 	  === null ||
			this.materia 	  === null ||
			this.profesorID   === null ||
			this.profesor	  === null ||
			this.laboratorios === null ||
			this.dias		  === null ||
			this.alumnos	  === null   ) {
			return false;
		}
		return true;
	}

	transformarDatos() {
		this.claseID = this.claseID.toUpperCase();
		this.grupoID = this.grupoID.toUpperCase();
		this.carreraID = this.carreraID.toUpperCase();
		this.cuatrimestre = this.cuatrimestre;
		this.materiaID = this.materiaID.toUpperCase();
		this.profesorID = this.profesorID.toUpperCase();
		this.dias = this.dias.toLowerCase();
	}

	toJson() {
		return {
			claseID			: this.claseID,
			tipo			: this.tipo,
			grupoID			: this.grupoID,
			carreraID		: this.carreraID,
			cuatrimestre	: this.cuatrimestre,
			materiaID		: this.materiaID,
			materia			: this.materia,
			profesorID		: this.profesorID,
			profesor		: this.profesor,
			laboratorios	: this.laboratorios,
			dias			: this.dias,
			alumnos			: this.alumnos,
			configuracion	: this.configuracion,
			horario			: this.horario
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
