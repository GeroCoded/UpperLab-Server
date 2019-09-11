var express = require('express');
var firestore = require('firebase-admin').firestore();
var mdAuthentication = require('./middlewares/authentication');

var app = express();


const equiposRef = firestore.collection('equipos');


// ====================================================== //
// ========== CONSULTAR EQUIPOS DE LABORATORIO ========== //
// ====================================================== //
app.get('/:clave', mdAuthentication.esAdminOSuper, (req, res)=>{
	
	var equipos = [];

	var clave = req.params.clave;

	equiposRef.where('laboratorio', '==', clave).get().then( snapshot => {

		if ( snapshot.empty ) {
			return res.status(200).json({
				ok: false,
				message: 'No hay ningún equipo registrado en el laboratorio ' + clave ,
				equipos
			});
		}

		var i = 0;

		snapshot.forEach( equipo => {
			equipos.push( equipo.data() );
			equipos[i].id = equipo.id;
			i++;
		});

		return res.status(200).json({
			ok: true,
			equipos
		});
	}).catch( err => {
		return res.status(200).json({
			ok: true,
			message: 'Sin registros',
			equipos,
			error: err
		});
	});
});





module.exports = app;
