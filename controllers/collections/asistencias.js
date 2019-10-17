
var firestore = require('firebase-admin').firestore();
var ObjetoResponse = require('../../models/objetoResponse');
var crypto = require('crypto');

// Modelos
var CodigoQRModel = require('../../models/codigoQRModel');


exports.registrarAsistencia = function registrarAsistencia( alumno, encryptedData ) {
	
	return new Promise( (resolve, reject) => {
		
		var respuesta = new ObjetoResponse(500, false, 'Internal Server Error. No se registro la asistencia.', null, null);
		
		var fecha = new Date();
		var diaHoy = fecha.getDay();
		// diaHoy = 1; // 'lunes' PRUEBA
		var mes = fecha.getMonth();
		var anio = fecha.getFullYear();
		var horaLlegada = fecha.getHours() * 60 + fecha.getMinutes();
		// horaLlegada = 420; // 7:25 A.M. PRUEBA

		var fechaHoy = fecha.getDate() + '-' + mes + '-' + anio;
		// fechaHoy = '7-10-2019'; // '7-10-2019' PRUEBA
		
		diaHoy = diaDeLaSemana( diaHoy );

		// ====================================================== //
		// =================== DECODIFICANDO QR ================= //
		// ====================================================== //

		var codigoQRModel = new CodigoQRModel();
		codigoQRModel.decrypt( encryptedData );
		
		// ====================================================== //
		// ====================================================== //
		// ====================================================== //
		
		/**
		 * 
		 * 1.- Recorrer las asignaciones del Alumno en busca de la clase que tiene
		 * 	   en este momento.
		 * 
		 * 2.- Si no tiene ninguna clase AHORA --> Error('No tienes ninguna clase en este momento.');
		 * 
		 * 3.- Si sí tiene por lo menos 1 asignaciones con una clase que está,
		 * 		transcurriendo ahora, se obtienen los ID's de los equipos de esas
		 * 		asignaciones. No importa si es 1 a o 2. También se obtienen sus
		 * 		respectivos laboratorios. [{ equipoID: '', laboratorio: '' }, ...];
		 * 
		 * 4.- Se compara el equipoID y laboratorio del codigoQR con los obtenidos
		 * 		de las asignaciones del Alumno.
		 * 
		 * 5.- Si coinciden, se procede a verificar si previamente ya había
		 * 		registrado su asistencia.
		 * 	   Si no --> Error('No estás autorizado a usar este equipo');
		 * 
		 * 6.- Si no ha registrado su asistencia, se agrega la asistencia.
		 * 	   Si ya --> Error('Ya has registrado tu asistencia.');
		 * 
		**/
		

		/**
		 * 1.- Recorrer las asignaciones del Alumno en busca de la clase que tiene
		 * 	   en este momento.
		 */

		var equiposLab = [];
		
		Object.keys( alumno.asignaciones ).forEach( key => {

			const asignacion = alumno.asignaciones[key];

			if ( diaHoy === asignacion.clase.dia ) {
				
				// ¿La hora de llegada el alumno está dentro del tiempo de la clase?
				if ( asignacion.clase.horaInicial <= horaLlegada && horaLlegada < asignacion.clase.horaFinal ) {
				
					// 3.- Se obtienen los equipoID's y los laboratorios.
					var equipoLab = { 
						equipoID: asignacion.equipo.id,
						laboratorio: asignacion.clase.laboratorio,
						claseID: asignacion.clase.id,
						horaInicial: asignacion.clase.horaInicial
					};
					equiposLab.push( equipoLab );
				}
			}

		});

		/** 
		 * 2.- Si no tiene ninguna clase AHORA --> Error('No tienes ninguna clase
		 * en este momento.');
		**/

		if ( equiposLab.length === 0 ) {
			respuesta = new ObjetoResponse(200, false, 'No tienes ninguna clase en este momento o no te han asignado un equipo para esta clase.', false, false);
			return resolve( respuesta );
		}

		/**
		 * 4.- Se compara el equipoID y laboratorio del codigoQR con los obtenidos
		 * 		de las asignaciones del Alumno.
		 */
		
		var equipoUtilizado;

		equiposLab.forEach( equipoLab => {

			if ( codigoQRModel.equipoID === equipoLab.equipoID && codigoQRModel.laboratorio === equipoLab.laboratorio.toUpperCase() ) {
				equipoUtilizado = equipoLab;
			}
			
		});

		/**
		 * 5.- Si coinciden, se procede a verificar si previamente ya había
		 * 		registrado su asistencia.
		 * 	   Si no --> Error('No estás autorizado a usar este equipo');
		 */

		// Si es null, está en un equipo no autorizado.
		if ( equipoUtilizado === undefined ) {
			// TODO: Enviar registro a la BITÁCORA DE USO NO AUTORIZADO DE EQUIPOS (usosnoautorizados);
			respuesta = new ObjetoResponse(401, false, 'No estás autorizado a usar este equipo', false, false);
			return resolve( respuesta );
		}

		// Se empieza a verificar si previamente ya había registrado su asistencia.

		/**
		 * 6.- Si no ha registrado su asistencia, se agrega la asistencia.
		 * 	   Si ya --> Error('Ya has registrado tu asistencia.');
		 */


		if ( !alumno.asistencias ) {
			// Objeto vacío si las asistencias no existen.
			alumno.asistencias = {};
		}
		
		// Asistencias del alumno de la clase actual.
		var asistenciasDelAlumno = alumno.asistencias[equipoUtilizado.claseID] || [];
		
		var yaSeHabiaRegistrado = false;
		
		// Recorrer las asistencias de la clase actual.
		asistenciasDelAlumno.forEach( asistencia => {
			var fechaDeAsistencia = asistencia.split(':')[0];
			
			// Si hay una fecha igual, ya habia registrado su asistencia.
			if ( fechaDeAsistencia === fechaHoy ) {
				yaSeHabiaRegistrado = true;
			}
		});

		if ( yaSeHabiaRegistrado ) {
			respuesta = new ObjetoResponse(200, false, 'Ya has registrado tu asistencia previamente.', false, false);
			return resolve( respuesta );
		}

		// Se genera el formato de la asistencia (e.g. '7-10-2019')
		var formatoAsistencia = generarFormatoDeAsistencia( fechaHoy, equipoUtilizado.horaInicial, horaLlegada );
		// Se agrega la nueva asistencia al [] de asistencias de la clase actual.
		asistenciasDelAlumno.push( formatoAsistencia );
		// Se agrega el nuevo arreglo a las asistencias del alumno.
		alumno.asistencias[equipoUtilizado.claseID] = asistenciasDelAlumno;

		var alumnoRef = firestore.collection('alumnos').doc( alumno.matricula );
		
		alumnoRef.update({ asistencias: alumno.asistencias }, {merge: true}).then( () => {
			respuesta = new ObjetoResponse(201, true, 'Asistencia registrada con éxito.', false, false);
			return resolve( respuesta );
		}).catch( err => {
			console.log(err);
			respuesta = new ObjetoResponse(500, false, 'Error al registrar asistencia', false, null);
			return resolve( respuesta );
		});
	});
};




// ====================================================== //
// ====== Función para regresar el nombre del día ======= //
// ====================================================== //

/**
 * Tranforma el número del día de la semana a su nombre equivalente en string.
 * 
 * @param {number} day El número del día de la semana
 */
function diaDeLaSemana(day) {

	if ( day === 1 ) {
		return 'lunes';
	} else if ( day === 2 ) {
		return 'martes';
	} else if ( day === 3 ) {
		return 'miercoles';
	} else if ( day === 4 ) {
		return 'jueves';
	} else if ( day === 5 ) {
		return 'viernes';
	} else if ( day === 6 ) {
		return 'sabado';
	} else {
		return 'domingo';
	}
}

function generarFormatoDeAsistencia(fechaActual, horaInicial, horaLlegada) {
	const diferencia = horaLlegada - horaInicial;
	
	if ( diferencia <= 10 ) {
		return fechaActual + ':A';
	} else if ( diferencia <= 15 ) {
		return fechaActual + ':R';
	} else {
		return fechaActual + ':F';
	}
}

