
class LaboratorioModel {

	constructor( laboratorio ) {
		this.nombre = laboratorio.nombre;
		this.clave = laboratorio.clave;
		this.claveVieja = laboratorio.claveVieja;
		this.edificio = laboratorio.edificio;
		this.encargados = laboratorio.encargados;
	}

	validarDatos() {

		if ( this.nombre == null  || this.clave == null || this.edificio == null){
			return false;
		}
		return true;
	}

	transformarDatos( esModificacion ) {
		this.clave = this.clave.toUpperCase();
		if ( esModificacion ) {
			this.claveVieja = this.claveVieja.toUpperCase();
		}
		
		if ( this.encargados !== null && this.encargados.length === 1 && this.encargados[0] === '') {
			console.log('Eliminando encargados');
			this.encargados = null;
		}
	}

	toJson() {
		return {
			nombre: this.nombre,
			clave: this.clave,
			edificio: this.edificio,
			encargados: this.encargados
		};
	}

}

module.exports = LaboratorioModel;
