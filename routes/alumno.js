var express = require('express');
var firestore = require('firebase-admin').firestore();

var mdAuthentication = require('./middlewares/authentication');
var userCRUD = require('../controllers/userCRUD');
var ObjetoResponse = require('../models/objetoResponse');

var app = express();

const COLECCION = 'alumnos';
const USUARIO_SINGULAR = 'alumno';
const USUARIO_PLURAL = 'alumnos';


const alumnosRef = firestore.collection(COLECCION);

// ====================================================== //
// ============ Consultar alumno por matrícula ========== //
// ====================================================== //
app.get('/:matricula', mdAuthentication.esAdminOSuperOAlumno, (req, res)=>{
	console.log('Consultando alumno por matricula... ' + req.params.matricula);
	
	var matricula = req.params.matricula.toUpperCase();

	userCRUD.consultarUsuarioPorMatricula( COLECCION, matricula, USUARIO_SINGULAR ).then( objetoResponse => {
		
		objetoResponse.consoleLog();
		return res.status(objetoResponse.code).json(objetoResponse.response);

	}).catch( objetoResponse => {
		objetoResponse.consoleLog();
		return res.status(objetoResponse.code).json(objetoResponse.response);

	});

});


// ====================================================== //
// ================= Consultar asignación =============== //
// ====================================================== //
app.get('/asignacion/:matricula/:claseID/:clave', mdAuthentication.esAdminOSuper, (req, res)=>{
	console.log('Consultando alumno con asignaciones... ' + req.params.matricula);
	
	var matricula = req.params.matricula.toUpperCase();
	var claseID = req.params.claseID;
	var clave = req.params.clave.toLowerCase();

	consultarAsignaciones( matricula, claseID, clave ).then( objetoResponse => {
		
		return res.status(objetoResponse.code).json(objetoResponse.response);

	}).catch( objetoResponse => {

		return res.status(objetoResponse.code).json(objetoResponse.response);

	});

});



// ====================================================== //
// =========== Consultar alumnos por matrículas ========= //
// ====================================================== //
app.get('/', mdAuthentication.esAdminOSuper, (req, res)=>{
	console.log('Consultando alumnos por matriculas... ');
	
	var matriculas = req.query.matriculas;
	var promesas = [];

	matriculas.forEach( matricula => {
		promesas.push( userCRUD.consultarUsuarioPorMatricula( COLECCION, matricula, USUARIO_SINGULAR) );
	});

	Promise.all(promesas).then( (objetosResponse, i) => {
		var alumnos = [];
		
		objetosResponse.forEach( (objetoResponse, i) => {
			console.log(i + ': ' + objetosResponse[i].response.alumno.matricula);
			alumnos.push( objetoResponse.response.alumno );
		});

		var objetoResponse = new ObjetoResponse( 200, true, 'Alumnos encontrados con éxito', {alumnos}, null);
		objetoResponse.consoleLog();
		return res.status(objetoResponse.code).json(objetoResponse.response);

	}).catch( objetoResponse => {
		objetoResponse = new ObjetoResponse(500, false, objetoResponse.response.message + '. Favor de hablar con el desarrollador.', null, objetoResponse.response.error);
		objetoResponse.consoleLog();
		return res.status(objetoResponse.code).json(objetoResponse.response);
	});
	
});




// ====================================================== //
// == Consultar alumnos con asignaciones por matrículas = //
// ====================================================== //
app.get('/asignaciones/matriculas/:claseID/:clave', /*mdAuthentication.esAdminOSuper,*/ (req, res)=>{
	console.log('Consultando alumnos con asignaciones por matriculas... ');
	var respuesta = new ObjetoResponse(500, false, 'Internal Server Error', null, null);
	var matriculas = req.query.matriculas;
	var claseID = req.params.claseID;
	var clave = req.params.clave;
	var promesas = [];
	var alumnos = [];

	matriculas.forEach( matricula => {
		promesas.push( userCRUD.consultarUsuarioPorMatricula( COLECCION, matricula, USUARIO_SINGULAR) );
	});

	Promise.all(promesas).then( objetosResponse => {

		promesas = [];

		objetosResponse.forEach( objetoResponse => {
			alumnos.push( objetoResponse.response.alumno );
			promesas.push(consultarAsignaciones( objetoResponse.response.alumno.matricula, claseID, clave ));
		});
		
		respuesta.message = 'Error al consultar las asignaciones de los alumnos.';
		return Promise.all(promesas);

	}).then( objetosResponse => {

		objetosResponse.forEach( (objetoResponse, i) => {
			alumnos[i].asignaciones = objetoResponse.response.asignaciones;
		});

		respuesta = new ObjetoResponse( 200, true, 'Alumnos con asignaciones consultados con éxito', {alumnos}, null);
		respuesta.consoleLog();
		return res.status(respuesta.code).json(respuesta.response);

	}).catch( respuesta => {
		respuesta = new ObjetoResponse(500, false, respuesta.response.message + '. Favor de hablar con el desarrollador.', null, respuesta.response.error);
		respuesta.consoleLog();
		return res.status(respuesta.code).json(respuesta.response);
	});
	
});

/**
 * Consultar las asignaciones de un alumno por medio de su matrícula, id de la
 * clase y la clave del laboratorio.
 * 
 * @param matricula Matrícula del alumno
 * @param claseID ID de la clase
 * @param clave La clave del laboratorio
 * @return Promesa con un ObjectResponse
 */
function consultarAsignaciones( matricula, claseID, clave ) {

	return new Promise( (resolve, reject) => {

		var asignaciones = {};
		var objetoResponse;

		var query = alumnosRef.doc(matricula).collection('asignaciones');
		query = query.where('clase.id', '==', claseID).where('clase.laboratorio', '==', clave.toLowerCase()).get();

		query.then( querySnapshot => {
			if ( querySnapshot.empty ) {
				objetoResponse = new ObjetoResponse(200, false, 'Alumno con matrícula ' + matricula + ' sin asignaciones.', {asignaciones}, null);
				return resolve(objetoResponse);
			}

			querySnapshot.forEach( asignacion => {
				asignaciones[asignacion.id] = asignacion.data();
			});

			objetoResponse = new ObjetoResponse( 200, true, null, {asignaciones}, null );
			return resolve(objetoResponse);
		}).catch( err => {
			objetoResponse = new ObjetoResponse( 500, false, `Error al buscar asignaciones del alumno con matrícula ${ matricula }`, null, err );
			return reject(objetoResponse);
		});
		
	});
}


app.put('/asignacionSimple', mdAuthentication.esAdminOSuper, (req, res) => {

	var asignacion = req.body.asignacion;

	asignarEquipo(asignacion).then( respuesta => {
		respuesta.consoleLog();
		return res.status(respuesta.code).json(respuesta.response);
	}).catch( respuesta => {
		respuesta.consoleLog();
		return res.status(respuesta.code).json(respuesta.response);
	});
});

app.put('/asignacionMultiple', mdAuthentication.esAdminOSuper, (req, res) => {

	var asignaciones = req.body.asignaciones;
});


function asignarEquipo( asignacion ) {
	return new Promise( (resolve, reject) => {
		
		// ObjetoResponse
		var respuesta;

		var asignacionID = `${asignacion.clase.id}-${asignacion.clase.dia}-${asignacion.clase.laboratorio}`;
		
		if ( asignacion.tipo === 'temporal' ) {
			asignacionID += `-temporal`
		}

		const asignarSet = alumnosRef.doc( asignacion.alumno.matricula )
		.collection('asignaciones').doc(asignacionID).set( asignacion, {merge: true} );

		asignarSet.then( () => {
			respuesta = new ObjetoResponse(201, true, 'Asignación de equipo hecha exitosamente', null, null);
			return resolve(respuesta);
		}).catch( err => {
			respuesta = new ObjetoResponse(500, false, 'Error al asignar equipo', null, err);
			return reject(respuesta);
		});
	});
}


/**
 * Eliminiar asignaciones de CIERTA clase, día y laboratorio
 */
app.delete('/asignaciones/:claseID/:diaLaboratorio', /*mdAuthentication.esAdminOSuper,*/ (req, res) => {
	console.log('Eliminando asignaciones: claseID = '+req.params.claseID+', diaLaboratorio = '+req.params.diaLaboratorio);
	eliminarAsignaciones( req.params.claseID, req.params.diaLaboratorio ).then( respuesta => {
		respuesta.consoleLog();
		return res.status(respuesta.code).json(respuesta.response);
	}).catch( err => {
		console.log(err);
		err.consoleLog();
		return res.status(err.code).json(err.response);
	})
});


function buscarAsignacionesDeClase( claseID, diaLaboratorio ) {

	return new Promise( (resolve, reject) => {
	
		var respuesta;
		var asignaciones = [];
		var query;

		diaLaboratorio = diaLaboratorio.split('-');

		/**
		 * Posibles inputs de 'diaLaboratorio':
		 *        INPUT       |    RESULT. SPLIT()    |    LENGTH     |  === CONSULTA WHERE ===
		 * -------------------------------------------------------------------------------------
		 *   A) 'lunes-ls1' |  ->  ['lunes','ls1']  |  length === 2 |  claseID, día y laboratorio
		 *  B) 'ls1'	   |  ->  ['ls1'] 		   |  length === 1 |  claseID      y laboratorio
		 * C) 'todas'	  |  ->  ['todas']   	  |  length === 1 |  claseID
		 */

		query = firestore.collectionGroup('asignaciones').where('clase.id', '==', claseID);

		if ( diaLaboratorio[0] !== 'todas' ) {
			query = query.where('clase.laboratorio', '==', diaLaboratorio[ diaLaboratorio.length-1 ]);
		}
		if ( diaLaboratorio.length === 2 ){
			query = query.where('clase.dia', '==', diaLaboratorio[0]);
		}

		query.get().then( querySnapshot => {

			if ( querySnapshot.empty ) {
				var mensaje = `No hay ninguna asignación con el id de clase ` + claseID;
				if ( diaLaboratorio.length === 2 ) {
					mensaje += `, dia '${ diaLaboratorio[0]}' y laboratorio '${ diaLaboratorio[1]}'`;
				} else if ( diaLaboratorio[0] !== 'todas' ) {
					mensaje += ` y laboratorio '${ diaLaboratorio[0]}'`;
				}
				respuesta = new ObjetoResponse(200, false, mensaje, {asignaciones}, null);
				respuesta.consoleLog();
				return resolve( respuesta );
			}

			var asignacionAuxiliar;

			querySnapshot.forEach( asignacionDoc => {
				asignacionAuxiliar = asignacionDoc.data();
				asignacionAuxiliar.ref = asignacionDoc.ref;
				asignaciones.push( asignacionAuxiliar );
			});
			
			respuesta = new ObjetoResponse(200, true, 'Asignaciones obtenidas con éxito', {asignaciones}, null);
			respuesta.consoleLog();
			return resolve( respuesta );
		}).catch( err => {
			console.log(err);
			respuesta = new ObjetoResponse(500, false, 'Error al buscar asignaciones de la clase ' + claseID, null, err);
			respuesta.consoleLog();
			return reject( respuesta );
		});
	});
}

function eliminarAsignaciones( claseID, diaLaboratorio ) {

	return new Promise( async (resolve, reject) => {

		try {
			
		
			var respuesta = await buscarAsignacionesDeClase( claseID, diaLaboratorio );

			let batch = firestore.batch();
			let asignaciones;

			if ( respuesta.code === 200 ) {
				asignaciones = respuesta.response.asignaciones;
				asignaciones.forEach( asignacionDoc => {
					batch.delete(asignacionDoc.ref);
				});
			}
			await batch.commit();
			respuesta = new ObjetoResponse(200, true, 'Asignaciones eliminadas con éxito', null, null);
			resolve(respuesta);
		} catch (error) {
			console.log(error);
			reject(error);
		}
	});
}


app.delete('/asignacion/:matricula/:asignacionID', /*mdAuthentication.esAdminOSuper,*/ (req, res) => {
	eliminarAsignacion( req.params.matricula, req.params.asignacionID ).then( respuesta => {
		return res.status(respuesta.code).json(respuesta.response);
	}).catch( respuesta => {
		return res.status(respuesta.code).json(respuesta.response);
	});
});

function eliminarAsignacion( matricula, asignacionID ) {

	return new Promise( async (resolve, reject) => {

		var respuesta;
		try {
			
			respuesta = new ObjetoResponse(500, false, 'Error al eliminar asignación '+asignacionID+' de alumno '+matricula, null, null);
			await alumnosRef.doc( matricula ).collection('asignaciones').doc( asignacionID ).delete();

		
			respuesta = new ObjetoResponse(200, true, 'Éxito al eliminar asignación '+asignacionID+' de alumno '+matricula, null, null);
			resolve(respuesta);
		} catch (error) {
			console.log(error);
			respuesta.error = error;
			reject(respuesta);
		}
	});
}



/**
 * Actualizar asignaciones de CIERTA clase, día y laboratorio
 */
app.put('/asignaciones', /*mdAuthentication.esAdminOSuper,*/ (req, res) => {
	// console.log('Actualizando asignacion:');
	// console.log(req.body.asignacion);
	actualizarAsignaciones( req.body.asignacion ).then( respuesta => {
		respuesta.consoleLog();
		return res.status(respuesta.code).json(respuesta.response);
	}).catch( err => {
		err.consoleLog();
		return res.status(err.code).json(err.response);
	})
});




function actualizarAsignaciones( asignacion ) {

	return new Promise( async (resolve, reject) => {
		
		try {
			
			var diaLaboratorio = asignacion.clase.dia+'-'+asignacion.clase.laboratorio;
			diaLaboratorio = diaLaboratorio.toLowerCase();
		
			var respuesta = await buscarAsignacionesDeClase( asignacion.clase.id, diaLaboratorio );
			
			let batch = firestore.batch();
			let asignaciones;

			if ( respuesta.code === 200 ) {
				asignaciones = respuesta.response.asignaciones;
				asignaciones.forEach( asignacionDoc => {
					batch.update(asignacionDoc.ref, { clase: asignacion.clase });
				});
			}
			await batch.commit();
			respuesta = new ObjetoResponse(200, true, 'Asignaciones actualizadas con éxito', null, null);
			resolve(respuesta);

		} catch (error) {
			console.log(error);
			reject(error);
		}
		
	});
}

// ====================================================== //
// ======= Consultar alumnos por grupo (y carrera) ====== //
// ====================================================== //
app.get('/:generacion/:carrera/:grupo', mdAuthentication.esAdminOSuper, (req, res)=>{
	var gen_carrera_grupo = req.params.generacion + '-' + req.params.carrera + '-' + req.params.grupo;

	alumnosRef.where('grupo', '==', gen_carrera_grupo).get()
	.then( snapshot => {

		var alumnos = [];

		if ( snapshot.empty ) {
			return res.status(200).json({
				ok: true,
				message: 'No existe ningún alumno en el grupo de ' + gen_carrera_grupo,
				alumnos
			});
		}

		snapshot.forEach( alumno => {
			alumnos.push(alumno.data());
		});

		return res.status(200).json({
			ok: true,
			alumnos
		});

	})
	.catch( err => {
		return res.status(500).json({
			ok: false,
			error: err
		});
	});
});

// ====================================================== //
// ================= Crear nuevo Alumno ================= //
// ====================================================== //
app.post('/', mdAuthentication.esAdminOSuper, (req, res)=>{
	userCRUD.crearUsuario(COLECCION, USUARIO_SINGULAR, req, res);
});

// ====================================================== //
// ======== Creación múltiple de Alumnos (Excel) ======== //
// ====================================================== //
app.post('/multiple', mdAuthentication.esAdminOSuper, (req, res)=>{

	userCRUD.crearMultiplesUsuarios( COLECCION, USUARIO_SINGULAR, req, res);

});


// ====================================================== //
// ================== Modificar Alumno ================== //
// ====================================================== //
app.put('/', mdAuthentication.esAdminOSuper, (req, res)=>{

	userCRUD.modificarUsuario(COLECCION, USUARIO_SINGULAR, req, res);

});


// ====================================================== //
// =================== Eliminar Alumno ================== //
// ====================================================== //
app.delete('/:matricula', mdAuthentication.esAdminOSuper, (req, res) => {

	userCRUD.eliminarUsuario(COLECCION, USUARIO_SINGULAR, req, res);

});


module.exports = app;
