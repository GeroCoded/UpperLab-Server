
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
};


exports.consultarClasesDelProfesor = function consultarClasesDelProfesor( matricula ) {
	return new Promise( (resolve, reject) => {
		
		var respuesta = new ObjetoResponse(500, false, 'Error al consultar clase del profesor', null, null);
		var clases = [];
		clasesRef.where('profesorID', '==', matricula).get().then( querySnapshot => {

			if ( querySnapshot.empty ) {
				respuesta = new ObjetoResponse(200, false, `El profesor con la matrícula ${ matricula } no tiene clases`, null, null);
				return resolve(respuesta);
			}

			querySnapshot.forEach( clase => {
				clases.push( clase.data() );
			});

			respuesta = new ObjetoResponse(200, true, `Clases del profesor con la matrícula ${ matricula } consultadas con éxito`, {clases}, null);
			return resolve(respuesta);
			
		}).catch( error => {
			console.log(error);
			return reject(respuesta);
		});
		
	});
};