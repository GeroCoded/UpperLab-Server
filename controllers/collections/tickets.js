
const firestore = require('firebase-admin').firestore();
const ticketsRef = firestore.collection('tickets');

const ObjetoResponse = require('../../models/objetoResponse');

const ESTADOS_TICKET = require('../../config/config').ESTADOS_TICKET;
const ESTADOS_ENCUESTA = require('../../config/config').ESTADOS_ENCUESTA;

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


exports.setEncuesta = function setEncuesta( id, encuesta ) {
	return new Promise( (resolve, reject) => {

		ticketsRef.doc( id ).update({ encuesta }).then( () => {
			return resolve( new ObjetoResponse(201, true, `Encuesta recibida. Gracias por tomarse el tiempo.`, null, null) );
		}).catch( error => {
			console.log(error);
			return reject( new ObjetoResponse(404, false, `El ticket enviado no existe`, null, null) );
		});
		
	});
};

exports.updateEstado = function updateEstado( id, estado ) {
	return new Promise( (resolve, reject) => {

		const data = { estado };
		const resuelto = estado === ESTADOS_TICKET.RESUELTO;
		const noResuelto = estado === ESTADOS_TICKET.NO_RESUELTO;
		const cancelado = estado === ESTADOS_TICKET.CANCELADO;
		if ( resuelto || noResuelto || cancelado ) {
			console.log('Entró');
			data['encuesta.estado'] = ESTADOS_ENCUESTA.DISPONIBLE;
		} else {
			console.log('No entró');
			data['encuesta.estado'] = ESTADOS_ENCUESTA.NO_DISPONIBLE;
		}

		console.log(data);

		ticketsRef.doc( id ).update( data ).then( () => {
			return resolve( new ObjetoResponse(200, true, `Estado del ticket ${ id } actualizado`, null, null) );
		}).catch( error => {
			console.log(error);
			return reject( new ObjetoResponse(404, false, `El ticket con el id ${ id } no existe`, null, null) );
		});
		
	});
};
