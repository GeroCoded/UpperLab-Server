var express = require('express');
var firestore = require('firebase-admin').firestore();
var mdAuthentication = require('./middlewares/authentication');

var app = express();


const plantillasRef = firestore.collection('plantillas');



// ====================================================== //
// ============ OBTENER PLANTILLAS POR TIPO ============= //
// ====================================================== //
app.post('/:tipo', mdAuthentication.esAdminOSuper, (req, res)=>{

	var tipo = req.params.tipo;
	var plantilas = [];
		
	plantillasRef.where('tipo', '==', tipo).get().then( querySnapshot => {

		if ( querySnapshot.empty ) {
			return res.status(200).json({
				ok: true,
				message: 'No hay plantillas de ' + tipo,
				plantillas
			});
		}

		querySnapshot.forEach( plantilla => {
			plantilas.push( plantilla.data() );
		});

		return res.status(200).json({
			ok: true,
			plantillas
		});

	}).catch( err => {
		console.log(err);
		return reject( err );
	});
});



// ====================================================== //
// =================== CREAR PLANTILLA ================== //
// ====================================================== //
app.post('/', mdAuthentication.esAdminOSuper, (req, res)=>{

	var plantilla = req.body.plantilla;
	console.log(req.body);
	console.log(plantilla);

	plantillasRef.add( plantilla ).then( docReference => {
		return res.status(200).json({
			ok: true
		});
	}).catch( err => {
		console.log(err);
		return res.status(500).json({
			ok: false,
			error: err
		});
	});
});



module.exports = app;
