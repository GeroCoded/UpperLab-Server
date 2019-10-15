const { io } = require('../index');
const { Usuarios } = require('../classes/usuarios');
const { crearMensaje } =  require('../utilidades/utilidades');

const usuarios = new Usuarios();

io.on('connection', (client) => {
	console.log('Usuario Conectado');


	client.on('join', (data) => {
		client.join(data.sala);
		console.log(data.user + ' ingreso a la sala: ' + data.sala);
		client.broadcast.to(data.sala).emit('nuevoUsuario ', {user:data.user, mensaje: ' ha ingresado a esta sala'});
	});

	client.on('leave', (data) => {
		console.log(data.user + ' dejó la sala: ' + data.sala);
		client.broadcast.to(data.sala).emit('Un usuario a abandonado la sala ', {user:data.user, mensaje:' abandonó la sala'});
		client.leave(data.sala);
	});

	client.on('nuevoMensaje', (data) => {
		console.log('Información recibida: ', data);
		io.in(data.sala).emit('Respuesta', { mensaje: data })
	});

});

