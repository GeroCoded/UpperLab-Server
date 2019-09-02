var express = require('express');
var firestore = require('firebase-admin').firestore();
var mdAuthentication = require('./middlewares/authentication');

var app = express();


const edificiosRef = firestore.collection('edificios');

// ====================================================== //
// ============ Consultar todos los edificios =========== //
// ====================================================== //
app.get('/', mdAuthentication.esAdminOSuper, (req, res)=>{
	
	var edificios = [];

	edificiosRef.orderBy('nombre').get().then( snapshot => {

		if ( snapshot.empty ) {
			return res.status(200).json({
				ok: false,
				message: 'No hay ningún edificio registrado ' ,
				edificios
			});
		}

		snapshot.forEach( edificio => {
			edificios.push( edificio.data() );
		});

		return res.status(200).json({
			ok: true,
			edificios
		});
	}).catch( err => {
		return res.status(200).json({
			ok: true,
			message: 'Sin registros',
			edificios,
			error: err
		});
	});
});





module.exports = app;
