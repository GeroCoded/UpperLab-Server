var express = require('express');
var firestore = require('firebase-admin').firestore();
var mdAuthentication = require('./middlewares/authentication');
var authController = require('../controllers/authentication');
var userValidator = require('../controllers/userValidator');

var app = express();



const alumnosRef = firestore.collection('alumnos');

app.get('/:carrera/:grupo',/* mdAuthentication.verificarToken,*/ (req, res)=>{
	
	
	var carrera = req.params.carrera;
	var grupo = req.params.grupo;

	alumnosRef.where('grupo', '==', carrera + '-' + grupo).get()
	.then( snapshot => {

		var alumnos = [];

		if ( snapshot.empty ) {
			console.log('No hay alumnos... Snapshot: ');
			console.log(snapshot);
			return res.status(200).json({
				ok: true
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
app.post('/', /*mdAuthentication.verificarToken,*/ (req, res)=>{
	var alumno = req.body.alumno;
	alumno.matricula = alumno.matricula.toUpperCase();
	alumno.correo = alumno.correo.toLowerCase();

	if ( !userValidator.validarDominioDelCorreo( alumno.correo ) ) {
		return res.status(400).json({
			ok: false,
			message: 'El correo no pertenece a la Universidad Politécnica del Estado de Morelos.'
		});
	}

	if ( !userValidator.validarMatriculaYCorreo( alumno.matricula, alumno.correo ) ) {
		return res.status(400).json({
			ok: false,
			message: 'La matrícula y el correo no coinciden'
		});
	}

	
	

	alumnosRef.doc(alumno.matricula).set(alumno).then( alumnoCreado => {

		var displayName = alumno.nombre + ' ' + alumno.apellidoP;
		
		var customClaims = {
			isAlumno: true,
			isProfesor: false,
			isAdmin: false,
			isSuperadmin: false
		};

		authController.crearCuentaDeUsuario(alumno.correo, alumno.matricula, displayName).then( usuario => {
			
			console.log('Successfully created new user:', usuario.uid);
			
			authController.asignarRolAUsuario(usuario.uid, {customClaims}).then(()=>{
				
				return res.status(201).json({
					ok: true,
					alumno: usuario
				});
				
			});
			
		})  
		.catch( err => {
			console.log('El alumno se creó, pero no su cuenta:', err);
			return res.status(500).json({
				ok: true,
				message: 'El alumno se creó, pero no su cuenta',
				error: err
			});
		});

		
		
		
	}).catch( err => {
		return res.status(500).json({
			ok: false,
			message: 'Error almacenando nuevo alumno',
			error: err
		});
	});
});


// ====================================================== //
// =================== Eliminar Alumno ================== //
// ====================================================== //
app.delete('/:matricula', (req, res) => {
	
	var matricula = req.params.matricula;
	matricula = matricula.toUpperCase();

	alumnosRef.doc(matricula).get().then( (alumnoDoc) => {

		if ( !alumnoDoc.exists ) {
			return res.status(400).json({
				ok: false,
				message: 'No se encontró al alumno con la matrícula ' + matricula
			});
		}

		alumnosRef.doc( matricula ).delete().then( () => {
			authController.obtenerCuentaDeUsuarioPorCorreo( matricula ).then( usuario => {
				authController.eliminarCuentaDeUsuario( usuario.uid ).then( () => {
					return res.status(200).json({
						ok: true,
						message: 'Alumno eliminado satisfactoriamente'
					});
				}).catch( err => {
					return res.status(500).json({
						ok: false,
						message: 'Error al eliminar cuenta de alumno con matrícula ' + matricula,
						error: err
			
					});
				});
			}).catch( err => {
				return res.status(400).json({
					ok: false,
					message: 'El registro del alumno de eliminó pero no se encontró la cuenta con matrícula ' + matricula,
					error: err
				});
			});
		}).catch( err => {
			return res.status(500).json({
				ok: false,
				message: 'Error al eliminar registro de alumno con matrícula ' + matricula,
				error: err
			});
		});
	}).catch( err => {
		return res.status(500).json({
			ok: false,
			message: 'Error al buscar alumno con matrícula ' + matricula,
			error: err
		});
	});
});

module.exports = app;
