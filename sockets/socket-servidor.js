const { io } = require('../index');
const { Clients } = require('../classes/clients');
const { mensajeBot } =  require('../utilidades/utilidades');
const { ROLES } =  require('../config/config');

const clients = new Clients();

/**
 * Conexión para `administradores` cuando están fuera de la pantalla del chat.
 */
io.of('/admin').on('connection', (socket) => {
	console.log('\x1b[32m%s\x1b[0m', 'Admin Conectado');

	socket.on('guardarInfoCliente', (data) => {
		console.log('Agregando admin...');
		clients.addClient( socket.id, data.matricula, data.nombre, data.rol );
		console.log(clients.getClients());
	});

	/**
	 * Listener para recibir notificaciones cuando algún usuario (alumno o
	 * profesor) envíe un mensaje.
	 */
	socket.on('notificacion', (data) => {
		console.log('Notificación recibida: ');
		console.log(data);
		/**
		 * Enviar la notificación a los administradores.
		 */
		io.of('/admin').emit('notificacion', data );
	});


	
	/**
	 * Evento para cuando se desconecta el cliente
	 */
	socket.on('disconnect', (reason) => {
		clients.deleteClientBySocketId( `${ socket.id }` );
	});
});


/**
 * Conexión para `alumnos y profesores` cuando están fuera de la pantalla del
 * chat.
 */
io.of('/usuario').on('connection', (socket) => {
	console.log('\x1b[32m%s\x1b[0m', 'Usuario Conectado');

	socket.on('guardarInfoCliente', (data) => {
		console.log('Agregando usuario...');
		clients.addClient( socket.id, data.matricula, data.nombre, data.rol );
		console.log(clients.getClients());
	});

	/**
	 * Listener para recibir notificaciones cuando algún administrador envíe un
	 * mensaje dentro de las conversaciones de sus tickets.
	 */
	
	 
	 
	/**
	 * Listener para enviar notificaciones a los administradores cuando el
	 * usuario (alumno o profesor) envíe un mensaje en uno de sus tickets.
	 * 
	 * Esta notificación sólo se envía a los administradores que están AFUERA
	 * del chat.
	 */
	socket.on('notificacion', (data) => {
		console.log('Notificación recibida: ');
		console.log(data);
		/**
		 * Enviar la notificación a los administradores.
		 */
		io.of('/admin').emit('notificacion', data );
	});

	/**
	 * Evento para cuando se desconecta el alumno/profesor
	 */
	socket.on('disconnect', (reason) => {
		clients.deleteClientBySocketId( `${ socket.id }` );
	});

});


/**
 * Conjunto de eventos para los usuarios que están en el chat.
 */
io.of('/chat').on('connection', (socket) => {
	
	console.log('\x1b[32m%s\x1b[0m', 'Usuario en CHAT Conectado');

	socket.on('guardarInfoCliente', (data) => {
		console.log('Agregando usuario en CHAT... ' + socket.id);
		clients.addClient( socket.id, data.matricula, data.nombre, data.rol );
		console.log(clients.getClients());
	});

	/**
	 * Evento para entrar a las salas
	 */
	socket.on('join', (data) => {
		socket.join(data.rooms, () => {
			console.log(data.nombre + ' ingreso a las salas: ' + data.rooms.join(', '));
			
			clients.saveRoomsOfClient( socket.id, data.rooms );
			
			data.rooms.forEach( room => {
				const mensaje = {
					matricula: 'WOLFBOT1423',
					nombre: 'Wolf Bot',
					mensaje: `${ data.nombre } ingresó al chat`,
					timestamp: Date.now().toString(),
					img: 'assets/images/users/wolf-bot.png',
					sala: room
				}
				socket.to(mensaje.sala).emit('recibirMensaje', mensaje);
	
			});
		});

	});
	
	/**
	 * Listener para saber cuando el alumno/profesor envió un mensaje en el chat.
	 */
	socket.on('nuevoMensaje', (mensaje) => {
		console.log('');
		console.log('');
		console.log('Se recibió un mensaje: ');
		console.log(mensaje);
		console.log('');
		console.log('Mis salas:');
		console.log(socket.rooms);
		console.log('');
		socket.to(mensaje.sala).emit('recibirMensaje', mensaje);
	});

	
	/**
	 * Listener para enviar notificaciones a los administradores cuando el
	 * usuario (alumno o profesor) envíe un mensaje en uno de sus tickets.
	 * 
	 * Esta notificación sólo se envía a los administradores que están AFUERA
	 * del chat.
	 */
	socket.on('notificacion', (data) => {
		console.log('Notificación recibida: ');
		console.log(data);
		/**
		 * Enviar la notificación a los administradores.
		 */
		io.of('/admin').emit('notificacion', data );
	});

	
	/**
	 * Evento para cuando se desconecta el usuario
	 */
	socket.on('disconnect', (reason) => {
		
		const clienteDesconectado = clients.deleteClientBySocketId( socket.id );
		console.log(clienteDesconectado);
		if ( clienteDesconectado.rol === ROLES.ALUMNO || clienteDesconectado.rol === ROLES.PROFESOR ) {
			clienteDesconectado.rooms.forEach( room => {
				const mensaje = mensajeBot(`${clienteDesconectado.nombre} se desconectó.`, room);
				socket.to(mensaje.sala).emit('recibirMensaje', mensaje);
			});
		}
	});
});

// io.on('connection', (socket) => {
// 	console.log('\x1b[32m%s\x1b[0m', 'Conexión Detectada');
	
// });


// io.on('connection', (client) => {
	// console.log('\x1b[32m%s\x1b[0m', 'Usuario Conectado');


	// client.on('join', (data) => {
	// 	client.join(data.sala);
	// 	console.log(data.user + ' ingreso a la sala: ' + data.sala);
	// 	client.broadcast.to(data.sala).emit('nuevoUsuario ', {user:data.user, mensaje: ' ha ingresado a esta sala'});
	// });

	// client.on('leave', (data) => {
	// 	console.log(data.user + ' dejó la sala: ' + data.sala);
	// 	client.broadcast.to(data.sala).emit('Un usuario a abandonado la sala ', {user:data.user, mensaje:' abandonó la sala'});
	// 	client.leave(data.sala);
	// });

// 	client.on('nuevoMensaje', (data) => {
// 		console.log('Información recibida: ', data);
// 		io.in(data.sala).emit('Respuesta', { mensaje: data })
// 	});

// });

