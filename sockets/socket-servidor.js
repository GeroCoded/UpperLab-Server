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
	console.log('');
	// console.log('\x1b[47m\x1b[30m%s\x1b[0m', '================================================================');
	console.log('\x1b[44m\x1b[37m%s\x1b[0m', 'connection');
	console.log('\x1b[32m%s\x1b[0m', 'Usuario en CHAT Conectado');

	socket.on('guardarInfoCliente', (data) => {
		console.log('');
		console.log('\x1b[47m\x1b[30m%s\x1b[0m', '================================================================');
		console.log('\x1b[44m\x1b[37m%s\x1b[0m', 'guardarInfoClient');
		console.log('\x1b[33m%s\x1b[0m', 'Agregando usuario en CHAT... ' + socket.id);

		clients.addClient( socket.id, data.matricula, data.nombre, data.rol );

		console.log('\x1b[36m%s\x1b[0m', 'Info de Clientes: ');
		console.log(clients.getClientsInfo());
		console.log('');
	});

	/**
	 * Evento para entrar a las salas
	 */
	socket.on('join', (data) => {
		console.log('');
		console.log('\x1b[47m\x1b[30m%s\x1b[0m', '================================================================');
		console.log('\x1b[44m\x1b[37m%s\x1b[0m', 'join');

		socket.join(data.rooms, () => {
			console.log(data.nombre + ' ingreso a las salas: ' + data.rooms.join(', '));
			
			clients.saveRoomsOfClient( socket.id, data.rooms );
			
			data.rooms.forEach( room => {
				const mensaje = mensajeBot(`${ data.nombre } ingresó al chat`, room);
				socket.to(mensaje.sala).emit('recibirMensaje', mensaje);
	
			});
			console.log('');
		});

	});
	
	/**
	 * Listener para saber cuando el alumno/profesor envió un mensaje en el chat.
	 */
	socket.on('nuevoMensaje', (mensaje) => {
		console.log('');
		console.log('\x1b[47m\x1b[30m%s\x1b[0m', '================================================================');
		console.log('\x1b[44m\x1b[37m%s\x1b[0m', 'nuevoMensaje');
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
		console.log('');
		console.log('\x1b[47m\x1b[30m%s\x1b[0m', '================================================================');
		console.log('\x1b[44m\x1b[37m%s\x1b[0m', 'notificacion');
		console.log(data);
		console.log('');
		/**
		 * Enviar la notificación a los administradores.
		 */
		io.of('/admin').emit('notificacion', data );
	});

	
	/**
	 * Evento para cuando se desconecta el usuario
	 */
	socket.on('disconnect', (reason) => {
		console.log('');
		console.log('\x1b[47m\x1b[30m%s\x1b[0m', '================================================================');
		console.log('\x1b[44m\x1b[37m%s\x1b[0m', 'disconnect');
		console.log('Cliente desconectado: ');
		const clienteDesconectado = clients.deleteClientBySocketId( socket.id );
		console.log(clienteDesconectado);
		if ( clienteDesconectado && (clienteDesconectado.rol === ROLES.ALUMNO || clienteDesconectado.rol === ROLES.PROFESOR) ) {
			clienteDesconectado.rooms.forEach( room => {
				const mensaje = mensajeBot(`${clienteDesconectado.nombre} se desconectó.`, room);
				socket.to(mensaje.sala).emit('recibirMensaje', mensaje);
			});
		}
		console.log('');
	});
});


io.of('/login').on('connection', (socket) => {
	console.log('');
	// console.log('\x1b[47m\x1b[30m%s\x1b[0m', '================================================================');
	console.log('\x1b[44m\x1b[37m%s\x1b[0m', 'connection');
	console.log('\x1b[32m%s\x1b[0m', 'PC en LOGIN Conectada');

	// Generar UUID para el nombre de la sala
	// const room = 'HARDCODED-ROOM123';

	socket.emit('uuid', socket.id);

	socket.on('codigoQREscaneado', (codigoQR) => {
		console.log('codigoQREscaneado');
		console.log(codigoQR);
		console.log(codigoQR.uuid);
		
		socket.to(codigoQR.uuid).emit('loguearse', codigoQR);
		socket.emit('loginResult', 'succeeessss');
	});

	socket.on('disconnect', (reason) => {
		console.log('');
		console.log('\x1b[47m\x1b[30m%s\x1b[0m', '================================================================');
		console.log('\x1b[44m\x1b[37m%s\x1b[0m', 'disconnect');
		console.log('PC desconectada: ');
	});
	
});

/**
 * Colores: 
 * Reset = "\x1b[0m"
 * Bright = "\x1b[1m"
 * Dim = "\x1b[2m"
 * Underscore = "\x1b[4m"
 * Blink = "\x1b[5m"
 * Reverse = "\x1b[7m"
 * Hidden = "\x1b[8m"
 * 
 * FgBlack = "\x1b[30m"
 * FgRed = "\x1b[31m"
 * FgGreen = "\x1b[32m"
 * FgYellow = "\x1b[33m"
 * FgBlue = "\x1b[34m"
 * FgMagenta = "\x1b[35m"
 * FgCyan = "\x1b[36m"
 * FgWhite = "\x1b[37m"
 * 
 * BgBlack = "\x1b[40m"
 * BgRed = "\x1b[41m"
 * BgGreen = "\x1b[42m"
 * BgYellow = "\x1b[43m"
 * BgBlue = "\x1b[44m"
 * BgMagenta = "\x1b[45m"
 * BgCyan = "\x1b[46m"
 * BgWhite = "\x1b[47m"
 */