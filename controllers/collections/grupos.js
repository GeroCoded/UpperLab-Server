
// Firestore
const { getBD, COLECCIONES } = require('../../config/config');
const gruposName = COLECCIONES.grupos;
const firestore = getBD( gruposName );

// Referencias de Firestore 
const gruposRef = firestore.collection(gruposName);

var ObjetoResponse = require('../../models/objetoResponse');
var BREAK_MESSAGE = require('../../config/config').BREAK_MESSAGE;

var clasesCtrl = require('./clases');

/**
 * Consulta todas la colección de grupos. Puede consultar grupos activos,
 * inactivos o ambos dependiendo del valor `activo`. Si es `undefined`, se consultan
 * tanto activos como inactivos. También por carrera.
 * 
 * @param activo Booleano, undefined o null
 * @param carrera Booleano, undefined o null
 * @return ObjetoResponse
 */
exports.consultarGrupos = async function consultarGrupos( activo, carrera ) {

	var respuesta = new ObjetoResponse( 500, false, 'Server Internal Error', null, null );
	var grupos = [];

	var consulta = gruposRef;

	console.log(activo);
	if ( activo !== undefined && activo !== null ) {
		console.log('1');
		consulta = consulta.where('activo', '==', activo);
	}
	
	console.log(carrera);
	if ( carrera !== undefined && carrera !== null ) {
		console.log('2');
		consulta = consulta.where('carrera', '==', carrera);
	}

	try {
		// Se ejecuta la consulta.
		respuesta.message = 'Error al consultar grupos';
		var querySnapshot = await consulta.get();

		if ( querySnapshot.empty ) {
			respuesta = new ObjetoResponse( 200, true, 'No hay grupos registrados.', { grupos }, null);
			throw new Error( BREAK_MESSAGE );
		}
		
		querySnapshot.forEach( grupo => {
			grupos.push(grupo.data());
		})
		
		respuesta = new ObjetoResponse( 200, true, null, { grupos }, null);
		return respuesta;

	} catch (err) {

		if ( err.message !== BREAK_MESSAGE ) {
			console.log(err);
			console.log(respuesta.message);
			respuesta.error = err;
		}
		return respuesta;
	}
};




exports.crearGrupo = function crearGrupo( grupo ) {
	
	return new Promise( (resolve, reject) => {

	
		var respuesta = new ObjetoResponse( 500, false, 'Internal Server Error', null, null );

		var grupoID = `${grupo.generacion}-${grupo.carrera.toUpperCase()}-${grupo.grupo.toUpperCase()}`;
		
		gruposRef.doc( grupoID ).create( grupo ).then( () => {
			
			respuesta = new ObjetoResponse( 201, true, 'Grupo creado exitosamente', null, null );
			return resolve(respuesta);

		}).catch( err => {

			respuesta = new ObjetoResponse( 400, true, 'El grupo que intenta agregar ya existe', null, err );
			return resolve(respuesta);

		});
	});
}


exports.modificarGrupoCompleto = function modificarGrupoCompleto( grupoID, grupo ) {
	return new Promise( (resolve, reject) => {

		console.log(grupoID);
		console.log(grupo);
		gruposRef.doc( grupoID ).update( grupo ).then( () => {
			return resolve(new ObjetoResponse( 200, true, 'Grupo modificado exitosamente.', null, null ));
		}).catch( err => {
			console.log(err);
			return resolve(new ObjetoResponse( 500, false, 'Error al modificar grupo.', null, err ));
		})
		
	});
}



exports.eliminarGrupo = async function eliminarGrupo( grupoID ) {
	
	try {
		await gruposRef.doc(grupoID).delete();
		return new ObjetoResponse(200, true, 'Grupo eliminado', null, null);

	} catch (err) {
		console.log(err);
		return new ObjetoResponse(500, false, 'Error inesperado al eliminar grupo', null, err);
	}
}

/**
 * Agrega o quita la matrícula del alumno de su grupo y sus clases.
 * 
 * @param grupoID String: ID del grupo del alumno
 * @param matricula String: Matrícula del alumno
 * @param agregar Boolean: `True` si se quiere agregar, `False` si se quiere quitar
 */
exports.agregarOQuitarAlumno = function agregarOQuitarAlumno( grupoID, matricula, agregar  ) {
	if ( agregar ) {
		console.log(`Agregando a alumno [${matricula}] a grupo [${grupoID}] y clases respectivas.`);
	} else {
		console.log(`Quitando a alumno [${matricula}] a grupo [${grupoID}] y clases respectivas.`);
	}
	
	let batch = firestore.batch();

	let grupoAlumnoRef = gruposRef.doc( grupoID );
	if ( agregar ) {
		batch.update( grupoAlumnoRef, { alumnos: admin.firestore.FieldValue.arrayUnion( matricula )});
	} else {
		batch.update( grupoAlumnoRef, { alumnos: admin.firestore.FieldValue.arrayRemove( matricula )});
	}

	clasesCtrl.consultarClasesPorGrupo( grupoID ).then( respuesta => {
		const clases = respuesta.response.clases;

		let ref;
		clases.forEach( clase => {
			ref = firestore.collection('clases').doc( clase.claseID );
			if ( agregar ) {
				batch.update( ref, { alumnos: admin.firestore.FieldValue.arrayUnion( matricula )});
			} else {
				batch.update( ref, { alumnos: admin.firestore.FieldValue.arrayRemove( matricula )});
			}
		})

		return batch.commit();
	}).then( respuesta => {
		return;
	}).catch( respuesta => {
		console.log(respuesta);
		respuesta.consoleLog();
	})
	

}