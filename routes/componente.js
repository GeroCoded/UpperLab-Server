var express = require('express');
var mdAuthentication = require('./middlewares/authentication');

var app = express();

// Firestore
const { getBD, COLECCIONES } = require('../config/config');
const componentesName = COLECCIONES.componentes;
const firestore = getBD( componentesName );

// Referencias de Firestore 
const componentesRef = firestore.collection(componentesName);


// ====================================================== //
// =========== Consultar todos los componentes ========== //
// ====================================================== //
app.get('/', mdAuthentication.esAdminOSuper, (req, res)=>{
	
	var promesa = Promise.all([
		getComponentes('tarjetaMadre'),
		getComponentes('procesador'),
		getComponentes('tarjetaDeVideo'),
		getComponentes('ram'),
		getComponentes('discoDuro'),
		getComponentes('fuenteDePoder'),
		getComponentes('monitor'),
		getComponentes('teclado'),
		getComponentes('raton')
	]);

	promesa.then( respuestas => {

		// console.log( respuestas );

		var componentes = {
			tarjetasMadre: 	 respuestas[0],
			procesadores: 	 respuestas[1],
			tarjetasDeVideo: respuestas[2],
			rams: 			 respuestas[3],
			discosDuros: 	 respuestas[4],
			fuentesDePoder:  respuestas[5],
			monitores: 		 respuestas[6],
			teclados: 		 respuestas[7],
			ratones: 		 respuestas[8]
		}

		return res.status(200).json({
			ok: true,
			componentes
		});
		
	}).catch( err => {
		console.log(err);
		return res.status(500).json({
			ok: false,
			componentes: [],
			err
		});
	});
	
});


// ====================================================== //
// ============ CONSULTAR COMPONENTE POR TIPO =========== //
// ====================================================== //
app.get('/:tipo', mdAuthentication.esAdminOSuper, (req, res)=>{
	
	var tipo = req.params.tipo;

	getComponentes( tipo ).then( componentes => {

		return res.status(200).json({
			ok: true,
			componentes
		});
		
	}).catch( err => {
		console.log(err);
		return res.status(500).json({
			ok: false,
			componentes: [],
			err
		});
	});
	
});



function getComponentes( componente ) {

	return new Promise( resolve => {

		var componentes = [];
		
		componentesRef.where('tipo', '==', componente).get().then( querySnapshot => {

			if ( querySnapshot.empty ) {
				return resolve( componentes );
			}
	
			var i = 0;

			querySnapshot.forEach( comp => {
				componentes.push( comp.data() );
				componentes[i].id = comp.id;
				i++;
			});
	
			return resolve( componentes );

		}).catch( err => {
			console.log(err);
			return reject( err );
		});
		
	});
}



// ====================================================== //
// ================== CREAR COMPONENTE ================== //
// ====================================================== //
app.post('/', mdAuthentication.esAdminOSuper, (req, res)=>{

	var componente = req.body.componente;
	console.log(componente);

	componentesRef.add( componente ).then( docReference => {
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
// ================= ELIMINAR COMPONENTE ================ //
// ====================================================== //
app.delete('/:id', mdAuthentication.esAdminOSuper, (req, res) => {
	var id = req.params.id;

	componentesRef.doc(id).delete().then( () => {

		return res.status(200).json({
			ok: true,
			message: 'Componente eliminado'
		});
	}).catch( err => {
		return res.status(500).json({
			ok: false,
			error: err
		});
	});
});

module.exports = app;
