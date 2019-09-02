var express = require('express');
var firestore = require('firebase-admin').firestore();
var mdAuthentication = require('./middlewares/authentication');

var app = express();

const carrerasRef = firestore.collection('carreras');

// ====================================================== //
// ========== Consultar materia por carrera ============= //
// ====================================================== //
app.get('/:clave/materias', /*mdAuthentication.esAdminOSuper,*/ async (req, res)=>{
	var response = await getMateriasPorCarrera( req.params.clave.toUpperCase() );
	return res.status(response.code).json(response.json);
});

// ====================================================== //
// ====== Consultar materia por carrera y cuatri ======== //
// ====================================================== //
app.get('/:clave/:cuatri/materias', /*mdAuthentication.esAdminOSuper,*/ async (req, res)=>{
	var response = await getMateriasPorCarreraYCuatri( req.params.clave.toUpperCase(), req.params.cuatri );
	return res.status(response.code).json(response.json);
});


function getMateriasPorCarrera( claveCarrera ) {

	var response = {};
	var cuatrimestres = {};
	
	return new Promise( (resolve) => {
		
		// TODO: Cambiar la colección de 'materias' a 'cuatrimestres'.
		carrerasRef.doc(claveCarrera).collection('cuatrimestres').get().then( (querySnapshot ) => {

			if ( querySnapshot.empty ) {
				response.code = 200;
				response.json = {
					ok: false,
					message: 'No existe ninguna materia en la carrera con la clave ' + claveCarrera,
					cuatrimestres
				};
				return resolve( response );
			}
			querySnapshot.forEach( queryDocumentSnapshot => {
				var idHolder = queryDocumentSnapshot.id;
				cuatrimestres[idHolder] = queryDocumentSnapshot.data();
			});
	
			response.code = 200;
			response.json = {
				ok: true,
				cuatrimestres
			};
			return resolve( response );
			
		}).catch( err => {
			
			response.code = 500;
			response.json = {
				ok: false,
				message: 'Error al buscar la carrera o las materias',
				error: err
			};
			return resolve( response );
		});
	});
	
}


function getMateriasPorCarreraYCuatri( claveCarrera, cuatrimestreID ) {


	var response = {};
	var cuatrimestre = {};
	
	return new Promise( (resolve) => {
		
		// TODO: Cambiar la colección de 'materias' a 'cuatrimestres'.
		carrerasRef.doc(claveCarrera).collection('cuatrimestres').doc(cuatrimestreID).get().then(  (documentSnapshot) => {

			if ( !documentSnapshot.exists ) {
				response.code = 200;
				response.json = {
					ok: false,
					message: 'No existe ninguna materia en la carrrera con la clave ' + claveCarrera,
					cuatrimestre
				};
				return resolve( response );
			}
			
			cuatrimestre = documentSnapshot.data();
	
			response.code = 200;
			response.json = {
				ok: true,
				cuatrimestre
			};
			return resolve( response );
			
		}).catch( err => {
			response.code = 500;
			response.json = {
				ok: false,
				message: 'Error al buscar laboratorio',
				error: err
			};
			return resolve( response );
		});
	});
	

	// return new Promise( async (resolve, reject) => {

	// 	var response = await getMateriasPorCarrera( req.params.clave.toUpperCase() );

	// 	// Guardar las materias obtenidas
	// 	var materias = response.materias;
	// 	response.materias = {};
	// 	response.materias[cuatrimestre] = materias[cuatrimestre];
	// 	return resolve( response );
	// });
}

module.exports = app;
