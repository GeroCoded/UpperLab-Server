
// Firestore
const { getBD, COLECCIONES } = require('../../config/config');
const clasificacionesName = COLECCIONES.clasificaciones;
const firestore = getBD( clasificacionesName );

// Referencias de Firestore 
const clasificacionesRef = firestore.collection(clasificacionesName);

const ObjetoResponse = require('../../models/objetoResponse');

exports.getClasificaciones = function getClasificaciones() {

	var clasificaciones = {};
	
	return new Promise( (resolve, reject) => {

		clasificacionesRef.get().then( querySnapshot => {

			if ( querySnapshot.empty ) {
				return resolve(new ObjetoResponse( 200, true, 'No hay ninguna clasificación en registrada', { clasificaciones }, null));
			}

			querySnapshot.forEach( clasificacion => {
				clasificaciones[ clasificacion.id ] = clasificacion.data();
			});
			
			return resolve(new ObjetoResponse( 200, true, null, { clasificaciones }, null));

		}).catch( error => {
			console.log(error);
			return reject(new ObjetoResponse( 500, false, 'Error al consultar clasificaciones', { clasificaciones }, null));
		});
	});
};


// exports.updateClasificaciones = function updateClasificaciones( clasificaciones ) {

// 	return new Promise( (resolve, reject) => {

// 		if ( !clasificaciones ) {
// 			return reject(new ObjetoResponse(400, false, 'No se mandó la información de la colección de clasificaciones', null, null));
// 		}
// 		var keys = Object.keys( clasificaciones );
// 		var promesas = [];

// 		for (let index = 0; index < keys.length; index++) {
// 			promesas.push( clasificacionesRef.doc( keys[index] ).set( clasificaciones ) );
// 		}

// 		Promise.all( promesas ).then( () => {
// 			return resolve(new ObjetoResponse( 200, true, 'Clasificaciones actualizadas correctamente', null, null));
// 		}).catch( error => {
// 			console.log(error);
// 			return reject(new ObjetoResponse( 500, false, 'Error al actualizar clasificaciones', null, null));
// 		});
		
// 	});
// };

exports.updateTipoDeClasificacion = function updateTipoDeClasificacion( document, tipoDeClasificacion ) {

	return new Promise( (resolve, reject) => {

		if ( !document ) {
			return reject(new ObjetoResponse(400, false, 'No se mandó la información de la clasificación', null, null));
		}

		if ( !tipoDeClasificacion ) {
			return reject(new ObjetoResponse(400, false, 'No se mandó el tipo de clasificación', null, null));
		}

		clasificacionesRef.doc( tipoDeClasificacion ).set( document ).then( () =>{
			return resolve(new ObjetoResponse( 200, true, 'Clasificación de tipo \''+tipoDeClasificacion+'\' actualizada correctamente', null, null));
		}).catch( error => {
			console.log(error);
			return reject(new ObjetoResponse( 500, false, 'Error al actualizar clasificación de tipo \''+tipoDeClasificacion+'\'', null, null));
		});
		
	});
};
