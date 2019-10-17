
class Clients {

	constructor() {
		this.clients = [];
	}

	// Agregar cliente a un arreglo de clientess
	addClient(socketId, matricula, nombre, rol) {
		console.log('Agregando a ' + nombre + ' (' + matricula + ' - ' + rol +')');
		let client = new Client();
		client.agregarClientInfo( socketId, matricula, nombre, rol );
		this.clients.push(client);
		return this.clients;
	}

	// Obtener un client por Matrícula
	getClientByMatricula( matricula ) {
		return this.clients.filter(client => client.matricula === matricula)[0];
	}

	// Obtener un client por SocketId
	getClientBySocketId( socketId ) {
		return this.clients.filter(client => client.socketId === socketId)[0];
	}

	// Obtener todos los clientes
	getClients(){
		return this.clients;
	}

	// Obtener clientes por sala (room)
	getClientByRoom( room ) {
		//...
	}

	// Eliminar cliente por el socketId en caso de que se desconecte
	deleteClientBySocketId( socketId ) {
		console.log('Borrando cliente [' + socketId + ']');
		let deletedClient = this.getClientBySocketId(socketId); 
		this.clients = this.clients.filter(client => client.socketId !== socketId );
		return deletedClient;
	}

	saveRoomsOfClient( socketId, rooms ) {
		let client = this.getClientBySocketId( socketId );
		client.rooms = rooms;
	}


}

class Client {
	constructor() {
		this.socketId = '';
		this.matricula = '';
		this.nombre = '';
		this.rol = 0;
		this.rooms = [];
	}

	agregarClientInfo( socketId, matricula, nombre, rol ) {
		this.socketId = socketId
		this.matricula = matricula;
		this.nombre = nombre;
		this.rol = rol;
	}

	
	
}

module.exports = {
	Clients, Client
}