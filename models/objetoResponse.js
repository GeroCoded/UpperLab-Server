
// Response Generator


// exports.getResponse = function getResponse( code, ok, message, objeto, error ) {

	
// };

class ObjetoResponse {
	
	/**
	 * Función para generar respuestas HTTP dinámicas.
	 * 
	 * @param code El 'status code' de la repuesta. (e.g. 200, 201, 400, 500)
	 * @param ok Booleano que dice si salió bien o no la petición.
	 * @param message Mensaje que podría usarse para mostrarse en el GUI para
	 * explicarle al usuario.
	 * @param objeto El objeto que se regresará con la respuesta. Debe ingresarse
	 * con un key-value pair. Ejemplo:  `new ObjetoResponse(..., {usuarios}, ...)`
	 * @param error En caso de que haya salido mal una operación, el error que se
	 * mostrará. (Usualmente es el error del catch)
	 * @return Un objeto con las 2 siguientes propiedades: 
	 * `[objetoResponse.code]`: Sirve para obtener el 'status code',
	 * `[objetoResponse.response]`: Aquí se encuentra toda la respuesta que usualmente se
	 * envía dentro de la función .json(). El uso final quedaría así:
	 * `return res.status(objetoResponse.code).json(objetoResponse.response);`
	 */
	constructor( code, ok, message, object, error ) {
		this.code = code;
		this.response = {
			ok: ok
		};

		if ( message ) {
			this.message = message;
		}

		if ( object ) {
			this.object = object;
		}
	
		if ( error ) {
			this.error = error;
		}
	}


	// SETTERS
	set ok( ok ) {
		this.response.ok = ok;
	}

	set message( message ) {
		this.response.message = message;
	}

	set error( error ) {
		this.response.error = error;
	}
	
	set object( object ) {
		var keyName = Object.keys( object )[0];
		this.response[keyName] = object[keyName];
	}


	/**
	 * Muestra en consola el status code y el mensaje de la respuesta. Esto 
	 * para que sea más sencillo debuggear si ya se encuentra el backend en
	 * firebase functions.
	 */
	consoleLog() {
		console.log(`${ this.code } | ${ this.response.message }`);
	}
}

module.exports = ObjetoResponse;
