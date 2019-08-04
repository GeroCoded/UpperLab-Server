// Requires
var express = require('express');


var admin = require('firebase-admin');
var serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://upperlab-e81d9.firebaseio.com'
});

// var mongoose = require('mongoose');

// Inicializar variables
var app = express();


// Rutas
app.get('/', (req, res, next )=>{

	admin.auth().getUser('GCLO151861')
		.then( userRecord => {
			console.log('Successfully fetched user data:', userRecord.toJSON());
			return res.status(200).json({
				ok: true,
				message: 'Petición realizada correctamente',
				userRecord
			});
		})
		.catch( err => {
			console.log('Error fetching user data:', err);
			return res.status(400).json({
				ok: false,
				message: 'Error fetching user data',
				error: err
			});
		});
});


// Escuchar peticiones del express
app.listen(3000, ()=>{
	console.log('Express server puerto 3000: \x1b[32m%s\x1b[0m', 'online');
});