var express = require('express');
var firestore = require('firebase-admin').firestore();
var mdAuthentication = require('./middlewares/authentication');
var authController = require('../controllers/authentication');
var userValidator = require('../controllers/userValidator');

var app = express();



const superadminsRef = firestore.collection('superadmins');

// ====================================================== //
// =========== Consultar todos los superadmin =========== //
// ====================================================== //
app.get('/'/*, mdAuthentication.verificarToken*/, (req, res)=>{
	
	var superadmins = [];

	superadminsRef.get().then( snapshot => {

		

		if ( snapshot.empty ) {
			return res.status(200).json({
				ok: false,
				message: 'No hay ningún superadministrador registrado' + matricula,
				superadmins
			});
		}

		snapshot.forEach( superadministrador => {
			superadministrador = superadministrador.data();
			delete superadministrador.contrasena;
			superadmins.push( superadministrador );
		});

		return res.status(200).json({
			ok: true,
			superadmins
		});
	}).catch( err => {
		return res.status(200).json({
			ok: true,
			message: 'Sin registros',
			superadmins,
			error: err
		});
	});
});




// ========================================================== //
// ============ Consultar superadmin por matrícula ========== //
// ========================================================== //
app.get('/:matricula',/* mdAuthentication.verificarToken,*/ (req, res)=>{
	
	var matricula = req.params.matricula.toUpperCase();

	firestore.collection('superadmins').doc(matricula).get()
	.then( superadminDoc => {
	
		if ( !superadminDoc.exists ) {
			return res.status(200).json({
				ok: false,
				message: 'No existe ningún superadministrador con la matrícula ' + matricula,
			});
		}

		var superadmin = superadminDoc.data();
		delete superadmin.contrasena;

		return res.status(200).json({
			ok: true,
			superadmin
		});
	})
	.catch( err => {
		return res.status(500).json({
			ok: false,
			message: 'Error al buscar superadministrador',
			error: err
		});
	});
});




// ====================================================== //
// ================= Crear nuevo Superadmin ================= //
// ====================================================== //
app.post('/', /*mdAuthentication.verificarToken,*/ (req, res)=>{
	
	if ( req.body.superadmin == null) {
		return res.status(400).json({
			ok: false,
			message: 'No se enviaron los datos del Superadministrador'
		});
	}
	
	var superadmin = req.body.superadmin;

	var validaciones = userValidator.validarDatosDelUsuario( superadmin, res);
	
	if ( validaciones != null ) {
		return validaciones;
	}
	
	superadmin.matricula = superadmin.matricula.toUpperCase();
	superadmin.correo = superadmin.correo.toLowerCase();

	superadminsRef.where('matricula', '==', superadmin.matricula).get().then( snapshot => {

		if ( !snapshot.empty ) {
			return res.status(400).json({
				ok: false,
				message: 'Ya existe un superadministrador con la matricula ' + superadmin.matricula
			});
		}

		superadmin.contrasena = superadmin.matricula;

		superadminsRef.doc(superadmin.matricula).set(superadmin).then( () => {
	
			var displayName = superadmin.nombre + ' ' + superadmin.apellidoP;
			
	
			authController.crearCuentaDeUsuario(superadmin.correo, superadmin.matricula, displayName).then( usuario => {
				
				var customClaims = {
					isAlumno: false,
					isProfesor: false,
					isAdmin: false,
					isSuperadmin: true
				};
				
				authController.asignarRolAUsuario(usuario.uid, {customClaims}).then(()=>{
					
					return res.status(201).json({
						ok: true,
						message: 'Superadministrador creado con éxito'
					});
					
				}).catch( err => {
					return res.status(500).json({
						ok: true,
						message: 'Error al asignar el rol de suepradministrador',
						error: err
					});
				});
				
			})  
			.catch( err => {
				return res.status(400).json({
					ok: true,
					message: 'El superadministrador se creó, pero ya existía una cuenta de autenticación con su correo',
					error: err
				});
			});
		}).catch( err => {
			return res.status(500).json({
				ok: false,
				message: 'Error almacenando nuevo superadministrador',
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
// ================= Modificar Superadmin ================= //
// ========================================================== //
app.put('/', /*mdAuthentication.verificarToken,*/ (req, res)=>{

	if ( req.body.superadmin == null) {
		return res.status(400).json({
			ok: false,
			message: 'No se enviaron los datos del Superadministrador'
		});
	}

	var superadmin = req.body.superadmin;
	
	var validaciones = userValidator.validarDatosDelUsuario( superadmin, res);
	
	if ( validaciones != null ) {
		return validaciones;
	}
	
	var matricula = superadmin.matricula.toUpperCase();
	delete superadmin.matricula;
	superadmin.correo = superadmin.correo.toLowerCase();

	superadminsRef.where('matricula', '==', matricula).get().then( snapshot => {

		if ( snapshot.empty ) {
			return res.status(400).json({
				ok: false,
				message: 'No existe el superadmininistrador con la matricula ' + matricula
			});
		}
		
		delete superadmin.contrasena;

		superadminsRef.doc(matricula).set(superadmin, {merge: true}).then( () => {
	
			return res.status(201).json({
				ok: true,
				message: 'Superadministrador modificado con éxito'
			});
			
		}).catch( err => {
			return res.status(500).json({
				ok: false,
				message: 'Error actualizando superadministrador',
				error: err
			});
		});
	}).catch( err => {
		return res.status(500).json({
			ok: false,
			message: 'Error al verificar existencia del superadministrador',
			error: err
		});
	});

});


// ====================================================== //
// =================== Eliminar Superadmin =================== //
// ====================================================== //
app.delete('/:matricula', (req, res) => {
	
	var matricula = req.params.matricula;
	matricula = matricula.toUpperCase();

	superadminsRef.doc(matricula).get().then( (superadminDoc) => {

		if ( !superadminDoc.exists ) {
			return res.status(400).json({
				ok: false,
				message: 'No se encontró al superadministrador con la matrícula ' + matricula
			});
		}

		superadminsRef.doc( matricula ).delete().then( () => {
			authController.obtenerCuentaDeUsuarioPorCorreo( matricula ).then( usuario => {
				authController.eliminarCuentaDeUsuario( usuario.uid ).then( () => {
					return res.status(200).json({
						ok: true,
						message: `Superadmin ${ superadminDoc.data().nombre } eliminado satisfactoriamente`
					});
				}).catch( err => {
					return res.status(500).json({
						ok: false,
						message: 'Error al eliminar cuenta de autenticación de superadministrador con matrícula ' + matricula,
						error: err
			
					});
				});
			}).catch( err => {
				return res.status(200).json({
					ok: false,
					message: 'El registro en la BD del superadministrador se eliminó pero, al parecer, el superadministrador no tenía ninguna cuenta vinculada para autenticarse',
					error: err
				});
			});
		}).catch( err => {
			return res.status(500).json({
				ok: false,
				message: 'Error al eliminar registro de superadministrador con matrícula ' + matricula,
				error: err
			});
		});
	}).catch( err => {
		return res.status(500).json({
			ok: false,
			message: 'Error al buscar superadministrador con matrícula ' + matricula,
			error: err
		});
	});
});

module.exports = app;
