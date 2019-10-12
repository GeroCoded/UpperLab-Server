var express = require('express');
var admin = require('firebase-admin');
var firestore = require('firebase-admin').firestore();
var mdAuthentication = require('./middlewares/authentication');
var objectsController = require('../controllers/objects');

var LaboratorioModel = require('../models/laboratorio');
var CodigoQRModel = require('../models/codigoQRModel');

var app = express();


const equiposRef = firestore.collection('equipos');


// ====================================================== //
// ============== CONSULTAR EQUIPOS POR ID ============== //
// ====================================================== //
app.get('/:idEquipo', mdAuthentication.esAdminOSuper, (req, res)=>{
	
	var idEquipo = req.params.idEquipo;

	equiposRef.doc(idEquipo).get().then( docSnapshot => {

		if ( !docSnapshot.exists ) {
			return res.status(200).json({
				ok: false,
				message: 'No hay ningún equipo con el ID ' + idEquipo ,
				equipos
			});
		}


		var equipo = docSnapshot.data();
		equipo.id = docSnapshot.id;

		return res.status(200).json({
			ok: true,
			equipo
		});
	}).catch( err => {
		return res.status(500).json({
			ok: false,
			message: 'Error al buscar equipo',
			error: err
		});
	});
});

// ====================================================== //
// ========== CONSULTAR EQUIPOS DE LABORATORIO ========== //
// ====================================================== //
app.get('/laboratorio/:clave', mdAuthentication.esAdminOSuper, (req, res)=>{
	
	var equipos = [];

	var clave = req.params.clave;

	equiposRef.where('laboratorio', '==', clave).orderBy('nombre').get().then( snapshot => {

		if ( snapshot.empty ) {
			return res.status(200).json({
				ok: false,
				message: 'No hay ningún equipo registrado en el laboratorio ' + clave ,
				equipos
			});
		}

		var i = 0;

		snapshot.forEach( equipo => {
			equipos.push( equipo.data() );
			equipos[i].id = equipo.id;
			i++;
		});

		return res.status(200).json({
			ok: true,
			equipos
		});
	}).catch( err => {
		return res.status(200).json({
			ok: true,
			message: 'Sin registros',
			equipos,
			error: err
		});
	});
});



// ====================================================== //
// ===================== CREAR EQUIPO =================== //
// ====================================================== //
app.post('/', mdAuthentication.esAdminOSuper, (req, res)=>{

	var plantilla = req.body.plantilla;
	var numEquipos = req.body.numEquipos; // El número de equipos que se van a crear.
	var laboratorio = new LaboratorioModel(req.body.laboratorio);
	var idLaboratorio = laboratorio.id;
	var ultimoNumEquipo = laboratorio.ultimoNumEquipo;

	var equipo;
	var promesas = [];

	var inicio = 1 + ultimoNumEquipo;
	var fin = numEquipos + ultimoNumEquipo;

	console.log('inicio: ' + inicio);
	console.log('fin: ' + fin);
	
	for (var i = inicio; i <= fin; i++) {
		
		equipo = objectsController.copiarObjeto( plantilla );
		
		if ( i < 10 ) {
			equipo.nombre = 'PC-0' + i;
		} else {
			equipo.nombre = 'PC-' + i;
		}

		console.log('i['+i+']' + equipo.nombre);

		if ( i === fin ) {
			ultimoNumEquipo = i;
		}
		
		promesas.push( crearEquipo( equipo ) );
	}

	Promise.all( promesas ).then( respuestas => {

		equiposFallidos = [];

		for (var i = 0; i < respuestas.length; i++) {
			if ( !respuestas[i] ) {
				equiposFallidos.push( ultimoNumEquipo + i + 1);
			}
		}

		equiposCreados = numEquipos - equiposFallidos.length;

		console.log('Número de Equipos: ' + numEquipos);
		console.log('Equipos Fallidos: ' + equiposFallidos.length);
		console.log('Equipos Creados: ' + equiposCreados);
		console.log('Clave Laboratorio: ' + idLaboratorio);

		return equiposCreados;

	}).then( equiposCreados => {

		return firestore.collection('laboratorios').doc(idLaboratorio).update({
			numEquipos: admin.firestore.FieldValue.increment( equiposCreados ),
			ultimoNumEquipo: ultimoNumEquipo
		});

	}).then( () => {

		var message;

		if ( equiposFallidos.length > 0 ) {
			message = 'Los equipos ' + equiposFallidos.join(', ') + ' no pudieron ser creados.';
		} else {
			message = 'Equipos creados con éxito';
		}

		console.log('Message: ' + message);

		return res.status(201).json({
			ok: true,
			message
		});
		
	}).catch( err => {
		console.log(err);
		return res.status(500).json({
			ok: false,
			message: 'Error al crear equipos',
			error: err
		});
	});

});


function crearEquipo(plantilla) {
	
	return new Promise( (resolve, reject) => {
		
		equiposRef.add( plantilla ).then( docReference => {
			return resolve( true );
		}).catch( () => {
			return resolve( false );
		});

	});
}


// ====================================================== //
// ================== ACTUALIZAR EQUIPO ================= //
// ====================================================== //
app.put('/', mdAuthentication.esAdminOSuper, (req, res) => {

	var equipo = req.body.equipo;

	equiposRef.doc(equipo.id).update(equipo).then( () => {

		return res.status(200).json({
			ok: true,
			message: 'Equipo actualizado'
		});

	}).catch( err => {
		console.log(err);
		return res.status(500).json({
			ok: false,
			message: 'Error al actualizar equipo',
			error: err
		});
	});
	
});


// ====================================================== //
// =================== ELIMINAR EQUIPO ================== //
// ====================================================== //
app.delete('/:idLaboratorio/:idEquipo', mdAuthentication.esAdminOSuper, (req, res) => {

	var idLaboratorio = req.params.idLaboratorio;
	var idEquipo = req.params.idEquipo;

	console.log('ID Laboratorio: ' + idLaboratorio);
	console.log('ID Equipo: ' + idEquipo);

	equiposRef.doc(idEquipo).delete().then( () => {
		return firestore.collection('laboratorios').doc(idLaboratorio).update({
			numEquipos: admin.firestore.FieldValue.increment( -1 )
		});
	}).then( () => {

		return res.status(200).json({
			ok: true,
			message: 'Equipo eliminado'
		});

	}).catch( err => {
		console.log(err);
		return res.status(500).json({
			ok: false,
			message: 'Error al decrementar el numero de equipos en ' + idLaboratorio,
			error: err
		});
	});
	
});



// ====================================================== //
// ============ CAMBIAR ESTADO DE COMPONENTE ============ //
// ====================================================== //
app.put('/componente', mdAuthentication.esAdminOSuper, (req, res) => {

	const idEquipo = req.body.idEquipo;
	const componente = req.body.componente;
	const estado = Number(req.body.estado);

	const estadoActualizado = {};

	estadoActualizado[componente+'.estado'] = estado;

	const actualizacion = equiposRef.doc(idEquipo).update(estadoActualizado);
	
	actualizacion.then( () => {

		return res.status(201).json({
			ok: true,
			message: 'Estado del componente actualizado'
		});
		
	}).catch( err => {

		if ( err.code === 5 ) {
			return res.status(400).json({
				ok: false,
				message: 'Datos erróneos',
			});
		} else {
			return res.status(500).json({
				ok: false,
				message: 'Error al actualizar estado del componente',
				error: err
			});
		}

	});
});




// ====================================================== //
// ========== OBTENER INFO DE EQUIPO ENCRIPTADO ========= //
// ====================================================== //
app.get('/encryptedID/laboratorio/:clave/equipo/:equipoID', /*mdAuthentication.esAdmin,*/ (req, res) => {
	const laboratorio = req.params.clave;
	const equipoID = req.params.equipoID;
	const codigoQRModel = new CodigoQRModel();
	return res.status(200).json({
		encrypted: codigoQRModel.encrypt({ equipoID, laboratorio })
	});
});


module.exports = app;

