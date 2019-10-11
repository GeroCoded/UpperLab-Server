
const firestore = require('firebase-admin').firestore();
const carrerasRef = firestore.collection('carreras');

const ObjetoResponse = require('../../models/objetoResponse');


exports.getCarreras = function getCarreras() {
	return new Promise( (resolve, reject) => {
		var respuesta;
		var carreras = [];

		carrerasRef.get().then( querySnapshot => {
			if ( querySnapshot.empty ) {
				respuesta = new ObjetoRespoense(200, true, `No hay ninguna carrera registrada`, {carreras}, null);
				return resolve( respuesta );
			}

			querySnapshot.forEach( queryDocumentSnapshot => {
				// var idHolder = queryDocumentSnapshot.id;
				carreras.push( queryDocumentSnapshot.data() );
			});
			
			return resolve( new ObjetoResponse(200, true, null, {carreras}, null) );
		}).catch( err => {
			return reject( new ObjetoResponse(500, false, 'Error al consultar carreras', null, err) );
		});
	});
};

exports.getCarrera = function getCarrera( clave ) {
	return new Promise( (resolve, reject) => {
		var respuesta;
		var carrera;

		carrerasRef.doc( clave ).get().then( documentSnapshot => {
			if ( !documentSnapshot.exists ) {
				respuesta = new ObjetoRespoense(404, false, `No existe la carrera con la clave ${ clave }`, null, null);
				return resolve( respuesta );
			}

			carrera = documentSnapshot.data();
			
			return resolve( new ObjetoResponse(200, true, null, {carrera}, null) );
		}).catch( err => {
			return reject( new ObjetoResponse(500, false, 'Error al consultar carrera', null, err) );
		});
	});
};


exports.getCuatrimestresDeCarrera = function getCuatrimestresDeCarrera( claveCarrera ) {

	return new Promise( (resolve) => {

		var respuesta;
		var cuatrimestres = {};
		
		carrerasRef.doc(claveCarrera).collection('cuatrimestres').get().then( (querySnapshot ) => {

			if ( querySnapshot.empty ) {
				respuesta = new ObjetoResponse(
					200, 
					false,
					'No existe ninguna cuatrimestre en ' + claveCarrera,
					{cuatrimestres},
					null
				);
				return resolve( respuesta );
			}
			querySnapshot.forEach( queryDocumentSnapshot => {
				var idHolder = queryDocumentSnapshot.id;
				cuatrimestres[idHolder] = queryDocumentSnapshot.data();
			});
	
			respuesta = new ObjetoResponse( 200, true, 'Cuatrimestres consultados con éxito', {cuatrimestres}, null);
			return resolve( respuesta );
			
		}).catch( err => {

			var respuesta = new ObjetoResponse( 500, false, 'Error al buscar la carrera o las materias', null, err);
			return resolve( respuesta );

		});
	});
};


exports.getMateriasDeCarreraYCuatri = function getMateriasDeCarreraYCuatri( claveCarrera, cuatrimestreID ) {

	return new Promise( (resolve) => {

		var respuesta;
		var cuatrimestre = {};
		
		carrerasRef.doc(claveCarrera).collection('cuatrimestres').doc(cuatrimestreID).get().then(  (documentSnapshot) => {

			if ( !documentSnapshot.exists ) {
				respuesta = new ObjetoResponse(200, false, 'No existe ninguna materia en la carrera con la clave ' + claveCarrera, {cuatrimestre}, null);
				return resolve( respuesta );
			}
			
			cuatrimestre = documentSnapshot.data();
	
			respuesta = new ObjetoResponse(200, true, 'Materias consultadas con éxito', {cuatrimestre}, null);
			return resolve( respuesta );
			
		}).catch( err => {
			respuesta = new ObjetoResponse(500, false, 'Error al buscar laboratorio', null, err);
			return resolve( respuesta );
		});
	});
};


exports.crearCarrera = function crearCarrera( carrera ) {
	return new Promise( (resolve, reject) => {

		carrerasRef.doc( carrera.clave ).create( carrera ).then( () => {

			return resolve( new ObjetoResponse(201, true, 'Carrera creada', null, null) );

		}).catch( error => {
			return reject( new ObjetoResponse(409, false, `La carrera con la clave ${ carrera.clave } ya existe`, null, null) );
		});
	});
};

exports.modificarCarrera = function modificarCarrera(clave, carrera) {
	return new Promise( (resolve, reject) => {

		delete carrera.clave;

		carrerasRef.doc( clave ).update( carrera ).then( () => {

			return resolve( new ObjetoResponse(200, true, 'Carrera modificada', null, null) );

		}).catch( error => {
			return reject( new ObjetoResponse(404, false, `La carrera con la clave ${ clave } no existe`, null, null) );
		});
	});
};

exports.eliminarCarrera = function eliminarCarrera( clave ) {
	return new Promise( (resolve, reject) => {

		carrerasRef.doc( clave ).delete().then( () => {

			return resolve( new ObjetoResponse(200, true, `Carrera '${ clave }' eliminada`, null, null) );

		}).catch( error => {
			console.log(error);
			return reject( new ObjetoResponse(500, false, `Internal Server Error`, null, null) );
		});
	});
};



// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ CUATRIMESTRES ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ //

exports.actualizarCuatrimestre = function actualizarCuatrimestre( clave, cuatri, cuatrimestre ) {
	return new Promise( (resolve, reject) => {

		carrerasRef.doc( clave ).collection('cuatrimestres').doc( cuatri ).set( cuatrimestre ).then( () => {

			return resolve( new ObjetoResponse(200, true, 'Cuatrimestre actualizado', null, null) );

		}).catch( error => {
			console.log(error);
			return reject( new ObjetoResponse(400, false, `No se enviaron los datos completos`, null, null) );
		});
	});
};
