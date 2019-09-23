var express = require('express');
var functions = requiere('firebase-functions');
var firestore = require('firebase-admin').firestore();
var crypto = require('crypto');
var mdAuthentication = require('./middlewares/authentication');
var CodigoQRModel = require('../models/codigoQRModel');
var ClaseModel = require ('./../models/clase');
var AlumnoModel = require ('./../models/alumno');


var app = express();

const clasesRef = firestore.collection('clases');

/**
* Función para generar respuestas HTTP dinámicas.
* 
* @param code El 'status code' de la repuesta. (e.g. 200, 201, 400, 500)
* @param ok Booleano que dice si salió bien o no la petición.
* @param message Mensaje que podría usarse para mostrarse en el GUI para
* explicarle al usuario.
* @param objeto El objeto que se regresará con la respuesta.
* @param error En caso de que haya salido mal una operación, el error que se
* mostrará. (Usualmente es el error del catch)
* @return Un objeto con las 2 siguientes propiedades: 
* `[objeto.code]`: Sirve para obtener el 'status code',
* `[objeto.response]`: Aquí se encuentra toda la respuesta que usualmente se
* envía dentro de la función .json(). El uso final quedaría así:
* `return res.status(objeto.code).json(objeto.response);`
*/

// ====================================================== //
// =========== Consultar Clase por horario ============== //
// ====================================================== //
app.post('/', /* mdAuthentication.esAlumno, */ (req, res)=>{
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

	var objeto = new CodigoQRModel(matricula, codigoQR, key, iv);
	
	cadena = objeto.decodificarCodigoQR(codigoQR, key, iv);
	
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
	
	//Consultar clase
	clasesRef.where('horario.'+ dia + '-' + laboratorio + '.horaFinal', '>', hora).get().then( querySnapshot => {
		
		if ( querySnapshot.empty ) {
			// Respuesta de que no hay ninguna clase actualmente.
			return res.status(200).json({
				ok: false,
				message: 'No hay clase',
				hora: hora
			});
		}
		
		// Clases obtenidas del día
		var claseI;
		var claseActual;
		querySnapshot.forEach( clase => {
			claseI = new ClaseModel( clase.data() );
			// console.log( claseI );

			if ( claseI.horario[diaLaboratorio].horaInicial <= hora && claseI.horario[diaLaboratorio].horaFinal > hora ) {
				claseActual = new ClaseModel( clase.data() );
			}
			
		});
		
		if ( claseActual == null ) {
			// Respuesta de que no existe ninguna clase actualmente.
			return res.status(200).json({
				ok: false,
				message: 'No existe ninguna clase actualmente',
				hora: hora
			});
		}
		
		console.log('La clase actual es: ' + claseActual.claseID);

		var i;
		for(i=0; i > claseActual.alumnos.length ; i++){
			if( !claseActual.alumnos[i].includes(matricula) ){
				return res.status(200).json({
					ok: true,
					message: 'El alumno no pertenece a la clase',
					claseActual
				});
			}
		}

		//Verificación de la asístencia diaria
		firestore.collection('alumnos').doc(matricula).get().then( alumnoDoc => {
			var alumno = new AlumnoModel( alumnoDoc.data() );
			if(alumno.asistencias[claseActual.claseID]){
				// Recorrer arreglo
				for(var i=0; i < alumno.asistencias[claseActual.claseID].length; i ++){
					var fecha = alumno.asistencias[claseAcutal.claseID][i].split(':')[0];
					if ( fecha === fechaActual) {
						return res.status(200).json({
							ok: false,
							message: 'ERROR: Ya se registro la asistencia'					
						});
					}else{
						console.log('No hay asistencia Registrada');
					}
				}
			} else {
				alumno.asistencias[claseActual.claseID] = [];
			}
			
			var marcaAsistencia = asistenciaCompleta(fechaActual, minutos);
			alumno.asistencias[claseActual.claseID].push(marcaAsistencia);
			
			//Ver el objeto para ver si se añadió la marcaAsistencia
			console.log(alumno.toJsonModified());

			// Actualizar documento ALUMNOS
			firestore.collection('alumnos').doc(matricula).update(alumno.toJsonModified(), {merge: true}).then( function() {
				return res.status(200).json({
					ok: true,
					message: 'El alumno se actualizo correctamente'
				});
			}).catch( function(err) {
				return res.status(200).json({
					ok: false,
					message: 'NO se actualizo la matricula ' + matricula
				});
			});
			
			console.log(marcaAsistencia);

		}).catch( err => {
			return res.status(200).json({
				ok: false,
				message: 'Ya se ha marcado la asistencia',
				error: err
			});			
		});
		
	}).catch (err =>{
		console.log(err);
		return res.status(500).json({
			ok: false,
			error: 'La consulta de la clase tiene un error'
		})
	});
});


// ====================================================== //
// ====== Función para regresar el nombre del día ======= //
// ====================================================== //

function diaEsp(day){
	var dia = String;
	if(day == 1){
		return dia = 'lunes';
	}else if(day == 2){
		return dia = 'martes'
	}else if(day == 3){
		return dia = 'miercoles'
	}else if(day == 4){
		return dia = 'jueves'
	}else if(day == 5){
		return dia == 'viernes'
	}else if(day == 6){
		return dia = 'sabado'
	}else{
		return dia = 'domingo'
	}
};

function asistenciaCompleta(fechaActual, minutos){
	if(minutos > 10 && minutos < 15){
		console.log('Marca Asistencia: ' + fechaActual + ':R');
		return fechaActual + ':R';
	} else if ( minutos > 15){
		console.log('Marca Asistencia: ' + fechaActual + ':F');
		return fechaActual + ':F';
	}else{
		console.log('Marca Asistencia: ' + fechaActual + ':A');
		return fechaActual + ':A';
	}
};

exports.helloWorld = functions.https.onRequest((request, response) => {
 response.send("Hola desde asistencisas Firebase!");
});


module.exports = app;