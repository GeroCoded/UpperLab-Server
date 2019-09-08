
// Response Generator

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
