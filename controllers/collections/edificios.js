
var firestore = require('firebase-admin').firestore();
var edificiosRef = firestore.collection('edificios');
var ObjetoResponse = require('../../models/objetoResponse');
var BREAK_MESSAGE = require('../../config/config').BREAK_MESSAGE;



exports.consultarEdificios = function consultarEdificios() {
	
	return new Promise( (resolve, reject) => {
		
		var edificios = [];

		var respuesta = new ObjetoResponse(500, false, 'Error al consultar los edificios', { edificios }, null);

		edificiosRef.orderBy('nombre').get().then( snapshot => {

			if ( snapshot.empty ) {
				return resolve(new ObjetoResponse( 200, true, 'No hay edificios registrados', { edificios }, null ));
			}

			snapshot.forEach( edificio => {
				edificios.push( edificio.data() );
			});

			return resolve( new ObjetoResponse(200, true, null, { edificios }, null) );

		}).catch( err => {
			respuesta.error = err;
			return reject( respuesta );
		});

	})
	
}



exports.crearEdificio = function crearEdificio( edificio ) {
	
	return new Promise( (resolve, reject) => {

	
		var respuesta = new ObjetoResponse( 500, false, 'Internal Server Error', null, null );
		
		edificiosRef.doc( edificio.clave ).create( edificio ).then( () => {
			
			respuesta = new ObjetoResponse( 201, true, 'Edificio creado exitosamente', null, null );
			return resolve(respuesta);

		}).catch( err => {

			respuesta = new ObjetoResponse( 400, true, 'El edificio que intenta agregar ya existe', null, err );
			return resolve(respuesta);

		});
	});
}


exports.eliminarEdificio = async function eliminarEdificio( claveEdificio ) {
	
	try {
		await edificiosRef.doc(claveEdificio).delete();
		return new ObjetoResponse(200, true, 'Edificio eliminado', null, null);

	} catch (err) {
		console.log(err);
		return new ObjetoResponse(500, false, 'Error inesperado al eliminar grupo', null, err);
	}
}
