var express = require('express');
var mdAuthentication = require('./middlewares/authentication');

var app = express();

// Firestore
const { getBD, COLECCIONES } = require('../config/config');
const plantillasName = COLECCIONES.plantillas;
const firestore = getBD( plantillasName );

// Referencias de Firestore 
const plantillasRef = firestore.collection(plantillasName);


// ====================================================== //
// ============ OBTENER PLANTILLAS POR TIPO ============= //
// ====================================================== //
app.get('/:tipo', mdAuthentication.esAdminOSuper, (req, res)=>{

	var tipo = req.params.tipo;
	var plantillas = [];
		
	plantillasRef.where('tipo', '==', tipo).get().then( querySnapshot => {

		if ( querySnapshot.empty ) {
			return res.status(200).json({
				ok: true,
				message: 'No hay plantillas de ' + tipo,
				plantillas
			});
		}

		var i = 0;
		querySnapshot.forEach( plantilla => {
			plantillas.push( plantilla.data() );
			plantillas[i].id = plantilla.id;
			i++;
		});

		return res.status(200).json({
			ok: true,
			plantillas
		});

	}).catch( err => {
		console.log(err);
		return res.status(500).json({
			ok: false,
			plantillas
		});
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


// ====================================================== //
// ================= MODIFICAR PLANTILLA ================ //
// ====================================================== //
app.put('/', mdAuthentication.esAdminOSuper, (req, res)=>{

	var plantilla = req.body.plantilla;
	var id = plantilla.id;

	plantillasRef.doc( id ).set( plantilla, { merge: true } ).then( () => {
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



// ====================================================== //
// ================== ELIMINAR PLANTILLA ================ //
// ====================================================== //
app.delete('/:id', mdAuthentication.esAdminOSuper, (req, res) => {
	var id = req.params.id;

	plantillasRef.doc(id).delete().then( () => {

		return res.status(200).json({
			ok: true,
			message: 'Plantilla eliminada'
		});
	}).catch( err => {
		return res.status(500).json({
			ok: false,
			error: err
		});
	});
});


module.exports = app;
