var express = require('express');
var firestore = require('firebase-admin').firestore();
var crypto = require('crypto');
var mdAuthentication = require('./middlewares/authentication');
var ObjetoResponse = require('../models/objetoResponse');
var BREAK_MESSAGE = require('../config/config').BREAK_MESSAGE;

// Modelos
var CodigoQRModel = require('../models/codigoQRModel');
var ClaseModel = require ('./../models/clase');
var AlumnoModel = require ('./../models/alumno');


var app = express();

const clasesRef = firestore.collection('clases');


// ====================================================== //
// =========== Consultar Clase por horario ============== //
// ====================================================== //
app.post('/', mdAuthentication.esAlumno, (req, res)=>{

	var objetoResponse = new ObjetoResponse(500, false, 'Internal Server Error', null, null);
	
	var fecha = new Date;
	var dia = fecha.getDay();
	var mes = fecha.getMonth();
	var anio = fecha.getFullYear();
	var minutos = fecha.getMinutes();
	var hora = (fecha.getHours()*60) + minutos;
	var matricula = 'RSEO168391';

	var fechaActual = fecha.getDate() + '-' + mes + '-' + anio;
	

	asistenciaCompleta(fechaActual, minutos);
	
	matricula  = matricula.toUpperCase();
	dia = diaEsp(dia);


	// ====================================================== //
	// =================== CODIFICANDO QR ================== //
	// ====================================================== //
	// Se convierte en cadena el JSON el objeto JSON que viene del codigoQR
	var objetoJson = { laboratorio: "LS1", idEquipo: '30'};
	var cadenaJson = JSON.stringify(objetoJson);
	var key = crypto.createHash('sha256').update(String('upperlab')).digest('base64').substr(0, 32);
	var iv = crypto.randomBytes(16);
	
	console.log('Cadena Original: ');
	console.log(cadenaJson);

	var encriptador = crypto.createCipheriv('aes-256-cbc', key, iv);
	var codigoQR = encriptador.update(cadenaJson, 'utf-8', 'hex');
	codigoQR += encriptador.final('hex');

	console.log('Codigo QR encriptado: ');
	console.log(codigoQR);
	
	// ====================================================== //
	// =================== DECODIFICANDO QR ================= //
	// ====================================================== //

	console.log(key);
	console.log(iv);

	var codigoQRModel = new CodigoQRModel(matricula, codigoQR, key, iv);
	
	cadena = codigoQRModel.decodificarCodigoQR(codigoQR, key, iv);
	
	console.log('La cadena descifrada es: ');
	console.log(cadena);
	
	// Convertir a objeto JSON el codigoQR
	var objeto = JSON.parse(cadena);
	
	console.log('El laboratorio desencriptado es: ');
	console.log(objeto);
	console.log('El equipo es: ');
	console.log(objeto.equipo);

	// ====================================================== //
	// ====================================================== //
	// ====================================================== //
	

	var laboratorio = 'ls1';
	var diaLaboratorio = dia + '-' + laboratorio;
	//Confirmación en consola
	// console.log('La matricula es: ' + matricula);
	// console.log('El día es: ' + dia);
	
	// hora = 430;
	
	// console.log('La hora es: ' + hora);
	
	objetoResponse.message = 'Error al consultar las clases de hoy';
	
	// Consultar las clases de hoy que aún no terminan
	clasesRef.where('horario.'+ dia + '-' + laboratorio + '.horaFinal', '>', hora).get().then( querySnapshot => {
		
		if ( querySnapshot.empty ) {
			// Respuesta de que no hay ninguna clase actualmente.
			objetoResponse = new ObjetoResponse(400, false, 'No hay clase actualmente.', {hora}, null);
			throw new Error(BREAK_MESSAGE);
		}
		
		
		var claseI; // Clase en la interación I
		var claseActual; // Clase que se está impartiendo "Ahora".

		// Recorrer las clases obtenidas.
		querySnapshot.forEach( clase => {
			claseI = new ClaseModel( clase.data() );

			// Checar si hay una clase a "esta" hora.
			if ( claseI.horario[diaLaboratorio].horaInicial <= hora && claseI.horario[diaLaboratorio].horaFinal > hora ) {
				// Se guarda esa clase.
				claseActual = new ClaseModel( clase.data() );
			}
		});
		
		if ( claseActual === null ) {
			// Respuesta de que no hay ninguna clase actualmente.
			objetoResponse = new ObjetoResponse(400, false, 'No hay clase actualmente.', {hora}, null);
			throw new Error(BREAK_MESSAGE);
		}
		
		console.log('La clase actual es: ' + claseActual.claseID);


		for(var i=0; i < claseActual.alumnos.length ; i++) {
			if( !claseActual.alumnos[i].includes(matricula) ) {
				objetoResponse = new ObjetoResponse(400, false, 'No perteneces a la clase actual', null, null);
				throw new Error(BREAK_MESSAGE);
			}
		}

		//Verificación de la asístencia diaria
		objetoResponse.message = 'Error al buscar los datos del alumno';
		return firestore.collection('alumnos').doc(matricula).get();

	}).then( alumnoDoc => {

		var alumno = new AlumnoModel( alumnoDoc.data() );

		if(alumno.asistencias[claseActual.claseID]) {
			// Recorrer arreglo de las asistencias del alumno en la clase actual.
			for(var i=0; i < alumno.asistencias[claseActual.claseID].length; i ++) {
				var fecha = alumno.asistencias[claseAcutal.claseID][i].split(':')[0];
				if ( fecha === fechaActual) {
					objetoResponse = new ObjetoResponse(200, true, 'Ya se registró la asistencia', null, null);
					throw new Error(BREAK_MESSAGE);
				}
				// Else: No ha registrado asistencia previamente el día de hoy en esta clase.
			}
		} else {
			alumno.asistencias[claseActual.claseID] = [];
		}
		
		var marcaAsistencia = asistenciaCompleta(fechaActual, minutos);
		alumno.asistencias[claseActual.claseID].push(marcaAsistencia);
		
		//Ver el objeto para ver si se añadió la marcaAsistencia
		console.log(alumno.toJsonModified());

		// Actualizar documento ALUMNOS
		objetoResponse.message = 'Error al actualizar la asistencia';
		return firestore.collection('alumnos').doc(matricula).update(alumno.toJsonModified(), {merge: true});

	}).then( () => {

		
		objetoResponse = new ObjetoResponse(200, true, 'El alumno se actualizo correctamente', null, null);
		return res.status(objetoResponse.code).json(objetoResponse.response);

	}).catch( err => {
		
		if ( err.message !== BREAK_MESSAGE ) {
			objetoResponse.error = err;
			console.log(err);
			console.log(objetoResponse.response);
		}
		return res.status(objetoResponse.code).json(objetoResponse.response);

	});
	
});


// ====================================================== //
// ====== Función para regresar el nombre del día ======= //
// ====================================================== //

function diaEsp(day) {

	if(day === 1) {
		return 'lunes';
	}else if(day === 2) {
		return 'martes';
	}else if(day === 3) {
		return 'miercoles';
	}else if(day === 4) {
		return 'jueves';
	}else if(day === 5) {
		return 'viernes';
	}else if(day === 6) {
		return 'sabado';
	}else{
		return 'domingo';
	}
}

function asistenciaCompleta(fechaActual, minutos) {
	if(minutos > 10 && minutos < 15) {
		console.log('Marca Asistencia: ' + fechaActual + ':R');
		return fechaActual + ':R';
	} else if ( minutos > 15) {
		console.log('Marca Asistencia: ' + fechaActual + ':F');
		return fechaActual + ':F';
	}else{
		console.log('Marca Asistencia: ' + fechaActual + ':A');
		return fechaActual + ':A';
	}
}


module.exports = app;