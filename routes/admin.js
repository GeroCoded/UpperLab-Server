var express = require('express');
var firestore = require('firebase-admin').firestore();
var mdAuthentication = require('./middlewares/authentication');
var authController = require('../controllers/authentication');
var userValidator = require('../controllers/userValidator');

var app = express();



const adminsRef = firestore.collection('admins');

// ====================================================== //
// ============== Consultar todos los admin ============= //
// ====================================================== //
app.get('/'/*, mdAuthentication.verificarToken*/, (req, res)=>{
	
	var admins = [];

	adminsRef.get().then( snapshot => {

		

		if ( snapshot.empty ) {
			return res.status(200).json({
				ok: false,
				message: 'No hay ningún administrador registrado' + matricula,
				admins
			});
		}

		snapshot.forEach( administrador => {
			administrador = administrador.data();
			delete administrador.contrasena;
			admins.push( administrador );
		});

		return res.status(200).json({
			ok: true,
			admins
		});
	}).catch( err => {
		return res.status(200).json({
			ok: true,
			message: 'Sin registros',
			admins,
			error: err
		});
	});
});




// ====================================================== //
// ============ Consultar admin por matrícula ========== //
// ====================================================== //
app.get('/:matricula',/* mdAuthentication.verificarToken,*/ (req, res)=>{
	
	var matricula = req.params.matricula.toUpperCase();

	firestore.collection('admins').doc(matricula).get()
	.then( adminDoc => {

		if ( !adminDoc.exists ) {
			return res.status(200).json({
				ok: false,
				message: 'No existe ningún admin con la matrícula ' + matricula,
			});
		}

		var admin = adminDoc.data();
		delete admin.contrasena;

		return res.status(200).json({
			ok: true,
			admin
		});
	})
	.catch( err => {
		return res.status(500).json({
			ok: false,
			message: 'Error al buscar admin',
			error: err
		});
	});
});




// ====================================================== //
// ================= Crear nuevo Admin ================= //
// ====================================================== //
app.post('/', /*mdAuthentication.verificarToken,*/ (req, res)=>{
	
	var admin = req.body.admin;

	var validaciones = userValidator.validarDatosDelUsuario( admin, res);
	
	if ( validaciones != null ) {
		return validaciones;
	}
	
	admin.matricula = admin.matricula.toUpperCase();
	admin.correo = admin.correo.toLowerCase();

	adminsRef.where('matricula', '==', admin.matricula).get().then( snapshot => {

		if ( !snapshot.empty ) {
			return res.status(400).json({
				ok: false,
				message: 'Ya existe un administrador con la matricula ' + admin.matricula
			});
		}

		admin.contrasena = admin.matricula;

		adminsRef.doc(admin.matricula).set(admin).then( adminCreado => {
	
			var displayName = admin.nombre + ' ' + admin.apellidoP;
			
	
			authController.crearCuentaDeUsuario(admin.correo, admin.matricula, displayName).then( usuario => {
				
				var customClaims = {
					isAlumno: false,
					isProfesor: false,
					isAdmin: true,
					isSuperadmin: false
				};
				
				authController.asignarRolAUsuario(usuario.uid, {customClaims}).then(()=>{
					
					return res.status(201).json({
						ok: true,
						admin: usuario
					});
					
				}).catch( err => {
					return res.status(500).json({
						ok: true,
						message: 'Error al asignar el rol de admin',
						error: err
					});
				});
				
			})  
			.catch( err => {
				return res.status(400).json({
					ok: true,
					message: 'El admin se creó, pero ya existía una cuenta de autenticación con su correo',
					error: err
				});
			});
		}).catch( err => {
			return res.status(500).json({
				ok: false,
				message: 'Error almacenando nuevo admin',
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
// ================= Modificar Admin ================= //
// ========================================================== //
app.put('/', /*mdAuthentication.verificarToken,*/ (req, res)=>{
	var admin = req.body.admin;
	
	var validaciones = userValidator.validarDatosDelUsuario( admin, res);
	
	if ( validaciones != null ) {
		return validaciones;
	}
	
	var matricula = admin.matricula.toUpperCase();
	delete admin.matricula;
	admin.correo = admin.correo.toLowerCase();

	adminsRef.where('matricula', '==', matricula).get().then( snapshot => {

		if ( snapshot.empty ) {
			return res.status(400).json({
				ok: false,
				message: 'No existe el admininistrador con la matricula ' + matricula
			});
		}
		
		delete admin.contrasena;

		adminsRef.doc(matricula).set(admin, {merge: true}).then( adminCreado => {
	
			return res.status(201).json({
				ok: true,
				admin: adminCreado
			});
			
		}).catch( err => {
			return res.status(500).json({
				ok: false,
				message: 'Error actualizando administrador',
				error: err
			});
		});
	}).catch( err => {
		return res.status(500).json({
			ok: false,
			message: 'Error al verificar existencia del administrador',
			error: err
		});
	});

});


// ====================================================== //
// =================== Eliminar Admin =================== //
// ====================================================== //
app.delete('/:matricula', (req, res) => {
	
	var matricula = req.params.matricula;
	matricula = matricula.toUpperCase();

	adminsRef.doc(matricula).get().then( (adminDoc) => {

		if ( !adminDoc.exists ) {
			return res.status(400).json({
				ok: false,
				message: 'No se encontró al admin con la matrícula ' + matricula
			});
		}

		adminsRef.doc( matricula ).delete().then( () => {
			authController.obtenerCuentaDeUsuarioPorCorreo( matricula ).then( usuario => {
				authController.eliminarCuentaDeUsuario( usuario.uid ).then( () => {
					return res.status(200).json({
						ok: true,
						message: `Admin ${ adminDoc.data().nombre } eliminado satisfactoriamente`
					});
				}).catch( err => {
					return res.status(500).json({
						ok: false,
						message: 'Error al eliminar cuenta de autenticación de admin con matrícula ' + matricula,
						error: err
			
					});
				});
			}).catch( err => {
				return res.status(200).json({
					ok: false,
					message: 'El registro en la BD del admin se eliminó pero, al parecer, el admin no tenía ninguna cuenta vinculada para autenticarse',
					error: err
				});
			});
		}).catch( err => {
			return res.status(500).json({
				ok: false,
				message: 'Error al eliminar registro de admin con matrícula ' + matricula,
				error: err
			});
		});
	}).catch( err => {
		return res.status(500).json({
			ok: false,
			message: 'Error al buscar admin con matrícula ' + matricula,
			error: err
		});
	});
});

module.exports = app;
