
const firestore = require('firebase-admin').firestore();
const clasesRef = firestore.collection('clases');

const ObjetoResponse = require('../../models/objetoResponse');


exports.consultarClasesPorGrupo = function consultarClasesPorGrupo( grupoID ) {
	return new Promise( (resolve, reject) => {
		var respuesta = new ObjetoResponse( 500, false, 'Internal Server Error', null, null );
		var clases = [];

		clasesRef.where('grupoID', '==', grupoID).get().then( querySnapshot => {
			if ( querySnapshot.empty ) {
				respuesta = new ObjetoResponse(200, true, `El grupo ${grupoID} no cuenta con ninguna clase`, {clases}, null);
				return resolve( respuesta );
			}

			querySnapshot.forEach( queryDocumentSnapshot => {
				// var idHolder = queryDocumentSnapshot.id;
				clases.push( queryDocumentSnapshot.data() );
			});
			
			return resolve( new ObjetoResponse(200, true, null, {clases}, null) );
		}).catch( err => {
			console.log(err);
			return reject( new ObjetoResponse(500, false, 'Error al consultar clases', null, null) );
		});
	});
}