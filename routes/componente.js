var express = require('express');
var firestore = require('firebase-admin').firestore();
var mdAuthentication = require('./middlewares/authentication');

var app = express();


const componentesRef = firestore.collection('componentes');

// ====================================================== //
// ============ Consultar todos los componentes =========== //
// ====================================================== //
app.get('/', mdAuthentication.esAdminOSuper, (req, res)=>{
	
	var promesa = Promise.all([
		getComponentes('tarjetaMadre'),
		getComponentes('tarjetaDeVideo'),
		getComponentes('procesador'),
		getComponentes('ram'),
		getComponentes('discoDuro'),
		getComponentes('monitor'),
		getComponentes('teclado'),
		getComponentes('raton')
	]);

	promesa.then( respuestas => {

		console.log( respuestas );

		var componentes = {
			tarjetasMadre: 	 respuestas[0],
			tarjetasDeVideo: respuestas[1],
			procesadores: 	 respuestas[2],
			rams: 			 respuestas[3],
			discosDuros: 	 respuestas[4],
			monitores: 		 respuestas[5],
			teclados: 		 respuestas[6],
			ratones: 		 respuestas[7]
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


function getComponentes( componente ) {

	return new Promise( resolve => {

		var componentes = [];
		
		componentesRef.where('tipo', '==', componente).get().then( querySnapshot => {

			if ( querySnapshot.empty ) {
				return resolve( componentes );
			}
	
			querySnapshot.forEach( comp => {
				componentes.push( comp.data() );
			});
	
			return resolve( componentes );

		}).catch( err => {
			console.log(err);
			return reject( err );
		});
		
	});
}





module.exports = app;
