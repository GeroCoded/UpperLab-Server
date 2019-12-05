
var ObjetoResponse = require('../../models/objetoResponse');

// Firestore
const { getBD, COLECCIONES } = require('../../config/config');
const alumnosName = COLECCIONES.alumnos;
const firestore = getBD( alumnosName );
const alumnosRef = firestore.collection(alumnosName);

// Controllers
const bitacorasCtrl = require('./bitacoras');

// Modelos
var CodigoQRModel = require('../../models/codigoQRModel');


exports.registrarAsistencia = function registrarAsistencia( alumno, encryptedData ) {
	
	return new Promise( (resolve, reject) => {
		
		var respuesta = new ObjetoResponse(500, false, 'Internal Server Error. No se registro la asistencia.', null, null);
		
		var fecha = new Date();
		var diaHoy = fecha.getDay();
		// diaHoy = 2; // 'martes' PRUEBA
		var mes = fecha.getMonth();
		var anio = fecha.getFullYear();
		var horaLlegada = fecha.getHours() * 60 + fecha.getMinutes();
		// horaLlegada = 436; // 7:16 A.M. PRUEBA
		var fechaHoy = fecha.getDate() + '-' + (mes+1) + '-' + anio;
		// fechaHoy = '03-12-2019'; // '28-9-2019' PRUEBA
		
		console.log('La fecha de hoy');
		console.log(fechaHoy);
		console.log('Hora de llegada (min): ' + horaLlegada);
		console.log('Hora de llegada (HH:mm): ' + fecha.getHours() + ':' + fecha.getMinutes());

		diaHoy = diaDeLaSemana( diaHoy );

		// ====================================================== //
		// =================== DECODIFICANDO QR ================= //
		// ====================================================== //

		var codigoQRModel = new CodigoQRModel();
		codigoQRModel.decrypt( encryptedData );
		
		// ====================================================== //
		// ====================================================== //
		// ====================================================== //
		
		/*
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
		

		/*
		 * 1.- Recorrer las asignaciones del Alumno en busca de la clase que tiene
		 * 	   en este momento.
		 */

		let asignacionActual;

		if ( !alumno.asignaciones ) {
			alumno.asignaciones = {};
		}
		console.log(alumno.asignaciones);

		for (const key in alumno.asignaciones) {
			if (alumno.asignaciones.hasOwnProperty(key)) {

				console.log(key);

				const asignacion = alumno.asignaciones[key];

				console.log('¿Dias iguales?');
				console.log(diaHoy + ' === ' + asignacion.clase.dia);
				console.log('');
				console.log('');

				if ( diaHoy === asignacion.clase.dia ) {
					
					console.log('¿La hora de llegada el alumno está dentro del tiempo de la clase?');
					console.log( asignacion.clase.horaInicial + ' <= ' + horaLlegada + ' && ' + horaLlegada + ' < ' + asignacion.clase.horaFinal);
					console.log( asignacion.clase.horaInicial <= horaLlegada && horaLlegada < asignacion.clase.horaFinal);
 
					console.log('');
					console.log('');

					// ¿La hora de llegada el alumno está dentro del tiempo de la clase?
					if ( asignacion.clase.horaInicial <= horaLlegada && horaLlegada < asignacion.clase.horaFinal ) {
						// 3.- Se obtienen los equipoID's y los laboratorios.
						asignacionActual = asignacion;
						console.log('Rompiendo...');
						console.log('Asignacion Actual:');
						console.log(asignacionActual);
						console.log('');
						break;
					}
				}
			}
		}

		/*
		 * 2.- Si no tiene ninguna clase AHORA --> Error('No tienes ninguna clase
		 * en este momento.');
		 */

		if ( asignacionActual === undefined ) {
			bitacorasCtrl.registrarUsoNoAutorizado( alumno, codigoQRModel.laboratorio, codigoQRModel.equipo.id, codigoQRModel.equipo.nombre, asignacionActual );
			respuesta = new ObjetoResponse(200, false, 'No tienes ninguna clase en este momento o no te han asignado un equipo para esta clase.', false, false);
			return resolve( respuesta );
		}

		/*
		 * 4.- Se compara el equipoID y laboratorio del codigoQR con los obtenidos
		 * 		de las asignaciones del Alumno.
		 */
		
		var esUnEquipoAutorizado = false;
		const mismoEquipo = codigoQRModel.equipo.id === asignacionActual.equipo.id;
		const mismoLaboratorio = codigoQRModel.laboratorio === asignacionActual.clase.laboratorio.toUpperCase();
		if ( mismoEquipo && mismoLaboratorio ) {
			esUnEquipoAutorizado = true;
		}
			

		/**
		 * 5.- Si coinciden, se procede a verificar si previamente ya había
		 * 		registrado su asistencia.
		 * 	   Si no --> Error('No estás autorizado a usar este equipo');
		 */

		// Si es null, está en un equipo no autorizado.
		if ( !esUnEquipoAutorizado ) {
			bitacorasCtrl.registrarUsoNoAutorizado( alumno, codigoQRModel.laboratorio, codigoQRModel.equipo.id, codigoQRModel.equipo.nombre, asignacionActual );
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
		var asistenciasDelAlumno = alumno.asistencias[asignacionActual.clase.id] || [];
		
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
		var formatoAsistencia = generarFormatoDeAsistencia( fechaHoy, asignacionActual.clase.horaInicial, horaLlegada );
		// Se agrega la nueva asistencia al [] de asistencias de la clase actual.
		asistenciasDelAlumno.push( formatoAsistencia );
		// Se agrega el nuevo arreglo a las asistencias del alumno.
		alumno.asistencias[asignacionActual.clase.id] = asistenciasDelAlumno;

		alumnosRef.doc( alumno.matricula ).update({ asistencias: alumno.asistencias }, {merge: true}).then( () => {
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

