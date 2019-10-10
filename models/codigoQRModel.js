var crypto = require('crypto');

class CodigoQRModel {
	constructor ( codigoQR ){
		this.codigoQR = codigoQR;
		this.equipoID = '';
		this.laboratorio = '';
		this.decodificarCodigoQR();
	}


	// ====================================================== //
	// ================ Funcion decodificar ================= //
	// ====================================================== //
	decodificarCodigoQR(){
		// La llave 'upperlab' es estatica de momento
		// var key = crypto.createHash('sha256').update(String('upperlab')).digest('base64').substr(0, 32);
		// var iv = crypto.randomBytes(16);

		// var descencriptador = crypto.createDecipheriv('aes-256-cbc', key, iv);
		// var cadena = descencriptador.update(this.codigoQR, 'hex', 'utf-8');
		// console.log();
		// console.log();
		// console.log(cadena);
		// cadena += descencriptador.final('utf-8');

		// console.log();
		// console.log();
		// console.log('Cadena Decodificada: ');
		// console.log(cadena);
		// console.log();
		// console.log();

		var cadena = '{"laboratorio":"LC","equipoID":"m8IExJr5SgMXwTN5MGLL"}';

		// Convertir a objeto JSON la cadena desencriptada.
		var objeto = JSON.parse(cadena);

		this.equipoID = objeto.equipoID;
		this.laboratorio = objeto.laboratorio;

		// return cadena;

		// console.log('La cadena descifrada es: ');
		// console.log(cadena);

		// // Convertir a objeto JSON el codigoQR
		// var objeto = JSON.parse(cadena);

		// console.log('El laboratorio desencriptado es: ');
		// console.log(objeto.laboratorio);
	}
}

module.exports = CodigoQRModel;