var express = require('express');
var mdAuthentication = require('./middlewares/authentication');
var ObjetoResponse = require('../models/objetoResponse');
var BREAK_MESSAGE = require('../config/config').BREAK_MESSAGE;
var ClaseModel = require('../models/clase');
var clasesCtrl = require('../controllers/collections/clases');
var app = express();

// Firestore
const { getBD, COLECCIONES } = require('../config/config');
const clasesName = COLECCIONES.clases;
const firestore = getBD( clasesName );

// Referencias de Firestore 
const clasesRef = firestore.collection( clasesName );

// ====================================================== //
// === Consultar Lista de Clases por Carrera y Grupo  === //
// ====================================================== //
app.get('/lista/:carreraID/:grupoID', mdAuthentication.esAdminOSuper, (req, res)=>{
	
	var clases = [];

	var carreraID = req.params.carreraID;
	var grupoID = req.params.grupoID;

	clasesRef.where('carreraID', '==', carreraID).where('grupoID', '==', grupoID).get().then( querySnapshot => {

		if ( querySnapshot.empty ) { 
			return res.status(200).json({
				ok: false,
				message: 'No hay clases en ' + carreraID + ' ' + grupoID
			});
		}

		

		querySnapshot.forEach( queryDocumentSnapshot => {
			clases.push( queryDocumentSnapshot.data() );
		});

		return res.status(200).json({
			ok: true,
			clases
		});
		
	}).catch( err => {
		return res.status(500).json({
			ok: false,
			message: 'Error al buscar clases',
			error: err
		});
	});
		
});

// ====================================================== //
// ======== Consultar Clase sin Horario asignado ======== //
// ====================================================== //
app.get('/sinHorario', mdAuthentication.esAdminOSuper, (req, res)=>{
	
	var clases = [];

	clasesRef.where('horario', '==', null).get().then( querySnapshot => {

		if ( querySnapshot.empty ) { 
			return res.status(200).json({
				ok: false,
				message: 'No hay clases sin horarios'
			});
		}

		

		querySnapshot.forEach( queryDocumentSnapshot => {
			clases.push( queryDocumentSnapshot.data() );
		});

		return res.status(200).json({
			ok: true,
			clases
		});
		
	}).catch( err => {
		return res.status(500).json({
			ok: false,
			message: 'Error al buscar clases',
			error: err
		});
	});
		
});


// ====================================================== //
// === Consultar Clase con Horario y Labs. asignados ==== //
// ====================================================== //
app.get('/conHorario/:laboratorio', mdAuthentication.esAdminOSuper, (req, res)=>{
	
	let clases = [];

	let laboratorio = req.params.laboratorio;
	laboratorio = laboratorio.toUpperCase();

	clasesRef.where('laboratorios', 'array-contains', laboratorio).get().then( querySnapshot => {

		if ( querySnapshot.empty ) { 
			return res.status(200).json({
				ok: false,
				message: 'No hay clases con horarios'
			});
		}

		querySnapshot.forEach( queryDocumentSnapshot => {
			clases.push( queryDocumentSnapshot.data() );
		});

		return res.status(200).json({
			ok: true,
			clases
		});
		
	}).catch( err => {
		return res.status(500).json({
			ok: false,
			message: 'Error al buscar clases',
			error: err
		});
	});
		
});


// ====================================================== //
// =============== CONSULTAR CLASE POR ID =============== //
// ====================================================== //
app.get('/:claseID',/* mdAuthentication.esAdminOSuper,*/ (req, res)=>{
	
	let claseID = req.params.claseID;

	clasesRef.doc(claseID).get().then( documentSnapshot => {

		if ( !documentSnapshot.exists ) {
			return res.status(400).json({
				ok: false,
				message: 'No existe la clase con el id ' + claseID
			});
		}

		clase = documentSnapshot.data();

		return res.status(200).json({
			ok: true,
			clase
		});
		
	}).catch( err => {
		return res.status(500).json({
			ok: false,
			message: 'Error al buscar clase',
			error: err
		});
	});
		
});


// ====================================================== //
// ================= CLASES DEL PROFESOR ================ //
// ====================================================== //
app.get('/profesor/:matricula', /*mdAuthentication.esAdminOSuperOProfesor,*/ (req, res) => {

	clasesCtrl.consultarClasesDelProfesor(req.params.matricula).then( respuesta => {
		respuesta.consoleLog();
		return res.status(respuesta.code).json(respuesta.response);
	}).catch( respuesta => {
		respuesta.consoleLog();
		return res.status(respuesta.code).json(respuesta.response);
	});
	
});


// ====================================================== //
// ================= Crear nueva Clase ================== //
// ====================================================== //
app.post('/', mdAuthentication.esAdminOSuper, (req, res)=>{

	var objetoResponse = new ObjetoResponse( 500, false, 'Internal Server Error', null, null );
	
	var clase = new ClaseModel( req.body.clase);
	
	// console.log(clase);
	
	if ( !clase.validarDatos() ) {
		objetoResponse = new ObjetoResponse(400, false, 'No se enviaron todos los datos de la clase', null, null);
		return res.status(objetoResponse.code).json(objetoResponse.response);
	}

	clase.transformarDatos();

	objetoResponse.message = 'Error al consultar clase ' + clase.claseID;

	clasesRef.doc(clase.claseID).get().then( documentSnapshot => {

		if ( documentSnapshot.exists ) {
			objetoResponse = new ObjetoResponse( 400, false, 'La clase ' + clase.claseID + ' ya existe', null, null );
			throw new Error(BREAK_MESSAGE);
		}

		objetoResponse.message = 'Error al crear la clase ' + clase.claseID;
	
		// console.log("========= CLASE TO JSON =========");
		// console.log(clase.toJson());
		
		return clasesRef.doc(clase.claseID).set( clase.toJson() );
		
	}).then( () => {
		
		objetoResponse = new ObjetoResponse( 200, true, 'Se ha creado la clase con éxito', null, null );
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
// =================== Modificar Clase ================== //
// ====================================================== //
app.put('/', mdAuthentication.esAdminOSuper, (req, res) => {
	
	var clase = new ClaseModel( req.body.clase );

	if ( !clase.validarDatos() ) {
		return res.status(400).json({
			ok: false,
			message: 'No se enviaron todos los datos de la clase'
		});
	}

	clase.transformarDatos();

	console.log(clase.toJsonModified());

	clasesRef.doc( clase.claseID ).update( clase.toJsonModified() ).then( () => {

		return res.status(200).json({
			ok: true,
			message: 'Clase modificada con éxito'
		});
		
	}).catch( err => {
		console.log(err);
		return res.status(500).json({
			ok: false,
			message: 'Error al modificar clase',
			error: err
		});
	});

});


// ====================================================== //
// ================ Eliminar Clase por ID =============== //
// ====================================================== //
app.delete('/:claseID', mdAuthentication.esAdminOSuper, (req, res) => {
	
	var objetoResponse = new ObjetoResponse(500, false, 'Internal Server Error', null, null);
	
	var claseID = req.params.claseID.toUpperCase();

	objetoResponse.message = 'Error al buscar clase con el ID ' + claseID;
	clasesRef.where('claseID', '==', claseID).get().then( (clasesSnapshot) => {

		var batch = firestore.batch();

		if ( clasesSnapshot.empty ) {
			objetoResponse = new ObjetoResponse(400, false, 'No se encontró ninguna clase con el ID ' + claseID, null, null);
			throw new Error(BREAK_MESSAGE);
		}

		if ( clasesSnapshot.docs.length > 1 ) {
			objetoResponse = new ObjetoResponse(400, false, 'Al parecer hay más de 1 clase con el mismo ID (' + claseID + '). No se eliminó ninguna clase. Favor de pedirle ayuda al desarrollador.', null, null);
			throw new Error(BREAK_MESSAGE);
		}

		clasesSnapshot.forEach( clase => {
            // For each class, add a delete operation to the batch
			batch.delete(clase.ref);
        });
		
		// Commit the batch
		objetoResponse.message = 'Error al eliminar clase con el ID ' + claseID;
		return batch.commit();

	}).then( () =>{ 

		objetoResponse = new ObjetoResponse(200, true, 'Clase eliminada con éxito', null, null);
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
// ============ Establecer Horarios de Clases =========== //
// ====================================================== //
app.post('/horarios', mdAuthentication.esAdminOSuper, (req, res)=>{
	
	var clases = [];

	req.body.clases.forEach(clase => {
		clases.push( new ClaseModel(clase) );
	});
	
	// console.log(clases);

	var batch = firestore.batch();
	var claseRef;

	clases.forEach(clase => {
		claseRef = firestore.collection('clases').doc(clase.claseID);
		batch.update( claseRef, {horario: clase.horario, laboratorios: clase.laboratorios, dias: clase.dias} );
	});

	batch.commit().then( () => {

		return res.status(200).json({
			ok: true,
			message: 'Horario actualizado con éxito'
		})
	}).catch( err => {

		return res.status(500).json({
			ok: false,
			message: 'Error al actualizar horario',
			error: err
		})
	});
});


module.exports = app;
