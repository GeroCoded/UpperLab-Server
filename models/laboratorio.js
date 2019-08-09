
class LaboratorioModel {

	constructor( laboratorio ) {
		this.nombre = laboratorio.nombre;
		this.abreviatura = laboratorio.abreviatura;
		this.abreviaturaVieja = laboratorio.abreviaturaVieja;
		this.edificio = laboratorio.edificio;
		this.encargados = laboratorio.encargados;
	}

	validarDatos() {

		if ( this.nombre == null  || this.abreviatura == null || this.edificio == null){
			return false;
		}
		return true;
	}

	transformarDatos( esModificacion ) {
		this.abreviatura = this.abreviatura.toUpperCase();
		if ( esModificacion ) {
			this.abreviaturaVieja = this.abreviaturaVieja.toUpperCase();
		}
		
		if ( this.encargados !== null && this.encargados.length === 1 && this.encargados[0] === '') {
			console.log('Eliminando encargados');
			this.encargados = null;
		}
	}

	toJson() {
		return {
			nombre: this.nombre,
			abreviatura: this.abreviatura,
			edificio: this.edificio,
			encargados: this.encargados
		};
	}

}

module.exports = LaboratorioModel;
