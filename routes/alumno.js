var express = require('express');
var firestore = require('firebase-admin').firestore();
var mdAuthentication = require('./middlewares/authentication');
var authController = require('../controllers/authentication');
var userValidator = require('../controllers/userValidator');

var app = express();



const alumnosRef = firestore.collection('alumnos');

// ====================================================== //
// ============ Consultar alumno por matrícula ========== //
// ====================================================== //
app.get('/:matricula', mdAuthentication.verificarToken, (req, res)=>{
	
	var matricula = req.params.matricula.toUpperCase();

	alumnosRef.doc(matricula).get()
	.then( alumnoDoc => {

		if ( !alumnoDoc.exists ) {
			return res.status(200).json({
				ok: false,
				message: 'No existe ningún alumno con la matrícula ' + matricula,
			});
		}

		return res.status(200).json({
			ok: true,
			alumno: alumnoDoc.data()
		});

	})
	.catch( err => {
		return res.status(500).json({
			ok: false,
			message: 'Error al buscar alumno',
			error: err
		});
	});
});




// ====================================================== //
// ======= Consultar alumnos por grupo (y carrera) ====== //
// ====================================================== //
app.get('/:carrera/:grupo', mdAuthentication.verificarToken, (req, res)=>{
	
	var carrera_grupo = req.params.carrera + '-' + req.params.grupo;

	alumnosRef.where('grupo', '==', carrera_grupo).get()
	.then( snapshot => {

		var alumnos = [];

		if ( snapshot.empty ) {
			return res.status(200).json({
				ok: true,
				message: 'No existe ningún alumno en el grupo de ' + carrera_grupo,
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
app.post('/', /*mdAuthentication.verificarToken,*/ (req, res)=>{
	
	if ( req.body.alumno == null) {
		return res.status(400).json({
			ok: false,
			message: 'No se enviaron los datos del alumno'
		});
	}

	var alumno = req.body.alumno;

	var validaciones = userValidator.validarDatosDelUsuario( alumno, res);
	
	if ( validaciones != null ) {
		return validaciones;
	}
	
	alumno.matricula = alumno.matricula.toUpperCase();
	alumno.correo = alumno.correo.toLowerCase();
	alumno.grupo = alumno.grupo.toUpperCase();

	alumnosRef.where('matricula', '==', alumno.matricula).get().then( snapshot => {

		if ( !snapshot.empty ) {
			return res.status(400).json({
				ok: false,
				message: 'Ya existe un alumno con la matricula ' + alumno.matricula
			});
		}

		alumnosRef.doc(alumno.matricula).set(alumno).then( () => {
	
			var displayName = alumno.nombre + ' ' + alumno.apellidoP;
			
	
			authController.crearCuentaDeUsuario(alumno.correo, alumno.matricula, displayName).then( usuario => {
				
				var customClaims = {
					isAlumno: true,
					isProfesor: false,
					isAdmin: false,
					isSuperadmin: false
				};
				
				authController.asignarRolAUsuario(usuario.uid, {customClaims}).then(()=>{
					
					return res.status(201).json({
						ok: true,
						message: 'Alumno creado con éxito'
					});
					
				}).catch( err => {
					return res.status(500).json({
						ok: true,
						message: 'Error al asignar el rol de alumno',
						error: err
					});
				});
				
			})  
			.catch( err => {
				return res.status(400).json({
					ok: true,
					message: 'El alumno se creó, pero ya existía una cuenta de autenticación con su correo',
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
	}).catch( err => {
		return res.status(500).json({
			ok: false,
			message: 'Error al verificar existencia',
			error: err
		});
	});

});


// ========================================================== //
// ==================== Modificar Alumno ==================== //
// ========================================================== //
app.put('/', mdAuthentication.verificarToken, (req, res)=>{

	if ( req.body.alumno == null) {
		return res.status(400).json({
			ok: false,
			message: 'No se enviaron los datos del alumno'
		});
	}
	
	var alumno = req.body.alumno;
	
	var validaciones = userValidator.validarDatosDelUsuario( alumno, res);
	
	if ( validaciones != null ) {
		return validaciones;
	}
	
	var matricula = alumno.matricula.toUpperCase();
	delete alumno.matricula;
	alumno.correo = alumno.correo.toLowerCase();
	alumno.grupo = alumno.grupo.toUpperCase();

	alumnosRef.where('matricula', '==', matricula).get().then( snapshot => {

		if ( snapshot.empty ) {
			return res.status(400).json({
				ok: false,
				message: 'No existe el alumno con la matricula ' + matricula
			});
		}
		
		delete alumno.contrasena;
		
		alumnosRef.doc(matricula).set(alumno, {merge: true}).then( () => {
	
			return res.status(201).json({
				ok: true,
				message: 'Alumno modificado con éxito'
			});
			
		}).catch( err => {
			return res.status(500).json({
				ok: false,
				message: 'Error actualizando alumno',
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
						message: `Alumno ${ alumnoDoc.data().nombre } eliminado satisfactoriamente`
					});
				}).catch( err => {
					return res.status(500).json({
						ok: false,
						message: 'Error al eliminar cuenta de autenticación de alumno con matrícula ' + matricula,
						error: err
			
					});
				});
			}).catch( err => {
				return res.status(200).json({
					ok: false,
					message: 'El registro en la BD del alumno se eliminó pero, al parecer, el alumno no tenía ninguna cuenta vinculada para autenticarse',
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
