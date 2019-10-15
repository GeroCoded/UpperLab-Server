
class Usuarios {

	constructor(){
		this.personas = [];
	}

	// Agregar personas a un arreglo de personas
	agregarPeronas(id, nombre){
		let persona = { id, nombre };
		this.personas.push(persona);

		return this.personas;
	}

	// Obtener una persona por ID
	getPersona( id ){
		let persona = this.personas.filter(persona => persona.id === id
		)[0];

		return persona;
	}

	//Obtener todas las personas
	getPersonas(){
		return this.personas;
	}

	//Obtener personas por Sala
	getPersonasPorSala(sala){
		//...
	}

	// Eliminar personas en caso de que se desconecte
	borrarPersona(id){
		let personaBorrada = this.getPersona(id);
		this.personas = this.personas.filter(persona => persona.id != id );
		return personaBorrada;
	}


}

module.exports = {
	Usuarios
}