const crearMensaje = (nombre, mensaje) => {
	return {
		nombre,
		mensaje,
		fecha: new Date().getTime()
	}
}

const mensajeBot = ( mensaje, sala ) => {
	return {
		matricula: 'WOLFBOT1423',
		nombre: 'Wolf Bot',
		mensaje: `${ mensaje }`,
		timestamp: Date.now().toString(),
		img: 'assets/images/users/wolf-bot.png',
		sala: sala
	};
}

module.exports = {
	crearMensaje,
	mensajeBot
}