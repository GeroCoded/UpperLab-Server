const { MATRICULA_WOLFBOT } =  require('../config/config');


const crearMensaje = (nombre, mensaje) => {
	return {
		nombre,
		mensaje,
		fecha: new Date().getTime()
	}
}

const mensajeBot = ( mensaje, sala ) => {
	return {
		matricula: MATRICULA_WOLFBOT,
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