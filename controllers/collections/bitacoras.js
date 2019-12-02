
const ObjetoResponse = require('../../models/objetoResponse');


// Firestore
const { getBD, getAdmin, COLECCIONES, SUBCOLECCIONES } = require('../../config/config');
const bitacorasName = COLECCIONES.bitacoras;
const firestore = getBD( bitacorasName );
const admin = getAdmin( bitacorasName );

// Referencias de Firestore 
const bitacorasRef = firestore.collection(bitacorasName);
const usosNoAutorizadosDoc = bitacorasRef.doc(SUBCOLECCIONES['NO-AUTORIZADO']);

exports.registrarUsoNoAutorizado = function registrarUsoNoAutorizado( alumno, laboratorio, equipoID, equipoNombre, asignacionActual ) {

	
	delete alumno.asignaciones;
	delete alumno.asistencias;
	delete alumno.sanciones;

	registro = {
		alumno,
		laboratorio,
		equipoIngresado: {
			id: equipoID,
			nombre: equipoNombre
		},
		fecha: new Date().toString()
	};
	
	if ( asignacionActual === undefined ) {
		registro.tipo = 2;
	} else {
		registro.tipo = 1;
		registro.equipoAsignado = asignacionActual.equipo;
		registro.clase = asignacionActual.clase;
	}
	
	firestore.collection('bitacoras').doc('NO-AUTORIZADO').set({
		registros: admin.firestore.FieldValue.arrayUnion(registro),
		numero: admin.firestore.FieldValue.increment(1)
	}, {merge: true}).then( () => console.log('Uso no autorizado registrado ', registro)
	).catch( error => console.log(error));
};


exports.consultarUsosNoAutorizados = function consultarUsosNoAutorizados() {

	return new Promise( (resolve, reject) => {

		var respuesta = new ObjetoResponse(500, false, 'Error al consultar registros de uso no autorizado.', null, null);
		var bitacora = {};
		usosNoAutorizadosDoc.get().then( documentSnapshot => {

			if( !documentSnapshot.exists ) {
				respuesta = new ObjetoResponse(200, false, 'No hay ningún registro de uso no autorizado', null, null);
				return resolve(respuesta);
			}
			
			bitacora = documentSnapshot.data();
			
			respuesta = new ObjetoResponse(200, true, 'Usos no autorizados consultados exitosamente.', { bitacora }, null);
			return resolve(respuesta);
		}).catch( error => {
			return reject(respuesta);
		});
		
	});
};


exports.consultarFormatoDePracticas = function consultarFormatoDePracticas() {
	
	return new Promise( (resolve, reject) => {

		var respuesta = new ObjetoResponse(500, false, 'Error al consultar formato de prácticas.', null, null);
		var formato = {};
		firestore.collection('bitacoras').doc('FORMATO-PRACTICAS').get().then( documentSnapshot => {
			if( !documentSnapshot.exists ) {
				respuesta = new ObjetoResponse(200, false, 'No hay ningún formato de prácticas', { formato }, null);
				return resolve(respuesta);
			}
			
			formato = documentSnapshot.data();
			
			respuesta = new ObjetoResponse(200, true, 'Usos no autorizados consultados exitosamente.', { formato }, null);
			return resolve(respuesta);
		}).catch( error => {
			console.log(error);
			return reject(respuesta);
		});
		
	});
};

exports.actualizarFormatoDePracticas = function actualizarFormatoDePracticas(inputs) {
	
	return new Promise( (resolve, reject) => {

		var respuesta = new ObjetoResponse(500, false, 'Error al actualizar formato de prácticas.', null, null);
		var formato = {};
		firestore.collection('bitacoras').doc('FORMATO-PRACTICAS').set( {inputs}, {merge: true} ).then( () => {
			respuesta = new ObjetoResponse(200, true, 'Formato actualizado exitosamente.', { formato }, null);
			return resolve(respuesta);
		}).catch( error => {
			console.log(error);
			return reject(respuesta);
		});
		
	});
};



exports.consultarPracticas = function consultarPracticas() {

	return new Promise( (resolve, reject) => {

		var respuesta = new ObjetoResponse(500, false, 'Error al consultar prácticas de laboratorio', null, null);
		
		var practicas = {};

		firestore.collection('bitacoras').doc('PRACTICAS').get().then( (documentSnapshot) => {

			if ( !documentSnapshot.exists ) {
				respuesta = new ObjetoResponse(200, false, 'No hay ninguna práctica registrada', { practicas }, null);
				return resolve(respuesta);	
			}

			practicas = documentSnapshot.data();
			
			respuesta = new ObjetoResponse(200, true, 'Prácticas de laboratorio consultadas con éxito', { practicas }, null);
			return resolve(respuesta);

		}).catch( error => {
			console.log(error);
			return reject( respuesta );
		});
	});
};

exports.registrarPractica = function registrarPractica( registro ) {

	return new Promise( (resolve, reject) => {

		var respuesta = new ObjetoResponse(500, false, 'Error al registrar práctica de laboratorio', null, null);
		
		firestore.collection('bitacoras').doc('PRACTICAS')
		.set({ registros: admin.firestore.FieldValue.arrayUnion(registro) }, {merge: true})
		.then( () => {
			
			respuesta = new ObjetoResponse(201, true, 'Práctica de laboratorio registrado con éxito', null, null);
			return resolve(respuesta);

		}).catch( error => {
			console.log(error);
			return reject( respuesta );
		});
	});
};
