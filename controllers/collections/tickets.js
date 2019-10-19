
const firestore = require('firebase-admin').firestore();
const ticketsRef = firestore.collection('tickets');

const ObjetoResponse = require('../../models/objetoResponse');


exports.updateChat = function updateChat( id, ticket ) {
	return new Promise( (resolve, reject) => {

		ticketsRef.doc( id ).update({ chat: ticket.chat }).then( () => {

			return resolve( new ObjetoResponse(200, true, `Chat del ticket ${ id } actualizado`, null, null) );
		}).catch( error => {
			console.log(error);
			return reject( new ObjetoResponse(404, false, `El ticket con el id ${ id } no existe`, null, null) );
		});
		
	});
};


exports.updateEstado = function updateEstado( id, estado ) {
	return new Promise( (resolve, reject) => {

		ticketsRef.doc( id ).update({ estado: estado }).then( () => {
			return resolve( new ObjetoResponse(200, true, `Estado del ticket ${ id } actualizado`, null, null) );
		}).catch( error => {
			console.log(error);
			return reject( new ObjetoResponse(404, false, `El ticket con el id ${ id } no existe`, null, null) );
		});
		
	});
};