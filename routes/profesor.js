var express = require('express');
var firestore = require('firebase-admin').firestore();
var mdAuthentication = require('./middlewares/authentication');
var authController = require('../controllers/authentication');
var userValidator = require('../controllers/userValidator');

var app = express();



const profesoresRef = firestore.collection('profesores');

// ====================================================== //
// ============ Consultar profesor por matrícula ========== //
// ====================================================== //
app.get('/:matricula', mdAuthentication.verificarToken, (req, res)=>{
	
	var matricula = req.params.matricula.toUpperCase();

	profesoresRef.doc(matricula).get()
	.then( profesorDoc => {

		if ( !profesorDoc.exists ) {
			return res.status(200).json({
				ok: false,
				message: 'No existe ningún profesor con la matrícula ' + matricula,
			});
		}

		var profesor = profesorDoc.data();
		delete profesor.contrasena;

		return res.status(200).json({
			ok: true,
			profesor
		});
	})
	.catch( err => {
		return res.status(500).json({
			ok: false,
			message: 'Error al buscar profesor',
			error: err
		});
	});
});




// ====================================================== //
// ======= Consultar profesores por carrera ====== //
// ====================================================== //
app.get('/carrera/:carrera', mdAuthentication.verificarToken, (req, res)=>{
	
	var carrera = req.params.carrera;

	profesoresRef.where(`carreras.${ carrera }`, '==', true).get()
	.then( snapshot => {

		var profesores = [];

		if ( snapshot.empty ) {
			return res.status(200).json({
				ok: true,
				message: 'No existe ningún profesor en la carrera de ' + carrera,
				profesores
			});
		}

		var profesorSinContrasena;
		
		snapshot.forEach( profesor => {
			profesorSinContrasena = profesor.data();
			delete profesorSinContrasena.contrasena;
			profesores.push(profesorSinContrasena);
		});

		return res.status(200).json({
			ok: true,
			profesores
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
// ================= Crear nuevo Profesor ================= //
// ====================================================== //
app.post('/', mdAuthentication.verificarToken, (req, res)=>{
	
	var profesor = req.body.profesor;

	var validaciones = userValidator.validarDatosDelUsuario( profesor, res);
	
	if ( validaciones != null ) {
		return validaciones;
	}
	
	profesor.matricula = profesor.matricula.toUpperCase();
	profesor.correo = profesor.correo.toLowerCase();

	profesoresRef.where('matricula', '==', profesor.matricula).get().then( snapshot => {

		if ( !snapshot.empty ) {
			return res.status(400).json({
				ok: false,
				message: 'Ya existe un profesor con la matricula ' + profesor.matricula
			});
		}

		profesoresRef.doc(profesor.matricula).set(profesor).then( profesorCreado => {
	
			var displayName = profesor.nombre + ' ' + profesor.apellidoP;
			
	
			authController.crearCuentaDeUsuario(profesor.correo, profesor.matricula, displayName).then( usuario => {
				
				var customClaims = {
					isAlumno: false,
					isProfesor: true,
					isAdmin: false,
					isSuperadmin: false
				};
				
				authController.asignarRolAUsuario(usuario.uid, {customClaims}).then(()=>{
					
					return res.status(201).json({
						ok: true,
						profesor: usuario
					});
					
				}).catch( err => {
					return res.status(500).json({
						ok: true,
						message: 'Error al asignar el rol de profesor',
						error: err
					});
				});
				
			})  
			.catch( err => {
				return res.status(400).json({
					ok: true,
					message: 'El profesor se creó, pero ya existía una cuenta de autenticación con su correo',
					error: err
				});
			});
		}).catch( err => {
			return res.status(500).json({
				ok: false,
				message: 'Error almacenando nuevo profesor',
				error: err
			});
		});
	}).catch( err => {
		return res.status(500).json({
			ok: false,
			message: 'Error al verificar existencia',
			error: err
		});
	});

});


// ========================================================== //
// ================= Modificar Profesor ================= //
// ========================================================== //
app.put('/', mdAuthentication.verificarToken, (req, res)=>{
	var profesor = req.body.profesor;
	
	var validaciones = userValidator.validarDatosDelUsuario( profesor, res);
	
	if ( validaciones != null ) {
		return validaciones;
	}
	
	var matricula = profesor.matricula.toUpperCase();
	delete profesor.matricula;
	profesor.correo = profesor.correo.toLowerCase();

	profesoresRef.where('matricula', '==', matricula).get().then( snapshot => {

		if ( snapshot.empty ) {
			return res.status(400).json({
				ok: false,
				message: 'No existe el profesor con la matricula ' + matricula
			});
		}
		
		delete profesor.contrasena;
		
		profesoresRef.doc(matricula).set(profesor, {merge: true}).then( profesorCreado => {
	
			return res.status(201).json({
				ok: true,
				profesor: profesorCreado
			});
			
		}).catch( err => {
			return res.status(500).json({
				ok: false,
				message: 'Error actualizando profesor',
				error: err
			});
		});
	}).catch( err => {
		return res.status(500).json({
			ok: false,
			message: 'Error al verificar existencia',
			error: err
		});
	});

});


// ====================================================== //
// =================== Eliminar Profesor ================== //
// ====================================================== //
app.delete('/:matricula', (req, res) => {
	
	var matricula = req.params.matricula;
	matricula = matricula.toUpperCase();

	profesoresRef.doc(matricula).get().then( (profesorDoc) => {

		if ( !profesorDoc.exists ) {
			return res.status(400).json({
				ok: false,
				message: 'No se encontró al profesor con la matrícula ' + matricula
			});
		}

		profesoresRef.doc( matricula ).delete().then( () => {
			authController.obtenerCuentaDeUsuarioPorCorreo( matricula ).then( usuario => {
				authController.eliminarCuentaDeUsuario( usuario.uid ).then( () => {
					return res.status(200).json({
						ok: true,
						message: `Profesor ${ profesorDoc.data().nombre } eliminado satisfactoriamente`
					});
				}).catch( err => {
					return res.status(500).json({
						ok: false,
						message: 'Error al eliminar cuenta de autenticación de profesor con matrícula ' + matricula,
						error: err
			
					});
				});
			}).catch( err => {
				return res.status(200).json({
					ok: false,
					message: 'El registro en la BD del profesor se eliminó pero, al parecer, el profesor no tenía ninguna cuenta vinculada para autenticarse',
					error: err
				});
			});
		}).catch( err => {
			return res.status(500).json({
				ok: false,
				message: 'Error al eliminar registro de profesor con matrícula ' + matricula,
				error: err
			});
		});
	}).catch( err => {
		return res.status(500).json({
			ok: false,
			message: 'Error al buscar profesor con matrícula ' + matricula,
			error: err
		});
	});
});

module.exports = app;
