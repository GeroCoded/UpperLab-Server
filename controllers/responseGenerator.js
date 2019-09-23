
// Response Generator

/**
 * Función para generar respuestas HTTP dinámicas.
 * 
 * @param code El 'status code' de la repuesta. (e.g. 200, 201, 400, 500)
 * @param ok Booleano que dice si salió bien o no la petición.
 * @param message Mensaje que podría usarse para mostrarse en el GUI para
 * explicarle al usuario.
 * @param objeto El objeto que se regresará con la respuesta.
 * @param error En caso de que haya salido mal una operación, el error que se
 * mostrará. (Usualmente es el error del catch)
 * @return Un objeto con las 2 siguientes propiedades: 
 * `[objeto.code]`: Sirve para obtener el 'status code',
 * `[objeto.response]`: Aquí se encuentra toda la respuesta que usualmente se
 * envía dentro de la función .json(). El uso final quedaría así:
 * `return res.status(objeto.code).json(objeto.response);`
 */
exports.getResponse = function getResponse( code, ok, message, objeto, error ) {

	var objetoResponse = {
		code,
		response: {
			ok
		}
	};

	if ( message ) {
		objetoResponse.response.message = message;
	}

	if ( objeto ) {
		var keyName = Object.keys( objeto )[0];
		// console.log(keyName);
		objetoResponse.response[keyName] = objeto[keyName];
	}

	if ( error ) {
		objetoResponse.response.error = error;
	}

	return objetoResponse;
};
