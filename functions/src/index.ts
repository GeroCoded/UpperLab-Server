import * as functions from 'firebase-functions';

// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript

exports.alCreatTicket = functions.firestore.document('tickets/{ticketid}').onCreate(async (documentSnapshot) =>{
	console.log('Nuevo ticket creado');

	const datos = documentSnapshot.data();

	console.log(datos);
	
	
});