var crypto = require('crypto');

class CodigoQRModel {
	constructor ( matricula, codigoQR, key, iv ){
		this.matricula = matricula;
		this.equipo = '';
		this.laboratorio = '';
		this.decodificarCodigoQR( codigoQR, key, iv );
	}


	// ====================================================== //
	// ================ Funcion decodificar ================= //
	// ====================================================== //
	decodificarCodigoQR( codigoQR, key, iv ){
		// La llave 'upperlab' es estatica de momento
		var descencriptador = crypto.createDecipheriv('aes-256-cbc', key, iv);
		var cadena = descencriptador.update(codigoQR, 'hex', 'utf-8');
		cadena += descencriptador.final('utf-8');

		// console.log('La cadena descifrada es: ');
		// console.log(cadena);

		// // Convertir a objeto JSON el codigoQR
		// var objeto = JSON.parse(cadena);

		// console.log('El laboratorio desencriptado es: ');
		// console.log(objeto.laboratorio);

		return cadena;
	}
}

module.exports = CodigoQRModel;