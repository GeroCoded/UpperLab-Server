
var admin = require('firebase-admin');
var firestore = admin.firestore();
var ObjetoResponse = require('../../models/objetoResponse');

const bitacorasRef = firestore.collection('bitacoras');
const usosNoAutorizadosDoc = bitacorasRef.doc('NO-AUTORIZADO');


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

