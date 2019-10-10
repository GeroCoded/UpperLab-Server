
const admin = require('firebase-admin');

exports.suscribirATopic = function suscribirATopic( registrationTokens, topic ) {
	
	return new Promise( (resolve, reject) => {

		// Subscribe the devices corresponding to the registration tokens to the
		// topic.
		admin.messaging().subscribeToTopic(registrationTokens, topic).then( (response) => {
			// See the MessagingTopicManagementResponse reference documentation
			// for the contents of response.
			console.log('Successfully subscribed to topic:', response);
			return resolve();
		})
		.catch( (error) => {
			console.log('Error subscribing to topic:', error);
			return reject(error);
		});

	});
	
};


exports.enviarMensajeATopic = function enviarMensajeATopic( payload, topic ) {

	payload.topic = topic;

	// Send a message to devices subscribed to the provided topic.
	admin.messaging().send(payload).then((response) => {
		// Response is a message ID string.
		console.log('Successfully sent message:', response);
		return;

	}).catch((error) => {
		console.log('Error sending message:', error);
	});
}
