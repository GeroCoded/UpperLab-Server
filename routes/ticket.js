var express = require('express');
var firestore = require('firebase-admin').firestore();
var mdAuthentication = require('./middlewares/authentication');
var ObjetoResponse = require('../models/objetoResponse');
const ticketsCtrl = require('../controllers/collections/tickets');

var app = express();


const ticketsRef = firestore.collection('tickets');



// ====================================================== //
// =========== OBTENER TICKETS POR MATRICULA ============ //
// ====================================================== //
app.get('/usuario/:matricula', mdAuthentication.esAdminOSuperOAlumnoOProfesor, (req, res) => {

	console.log('GET - Consultando Ticket por matrícula');

	var matricula = req.params.matricula.toUpperCase();
	var tickets = [];

	console.log(matricula);
		
	ticketsRef.where('usuario.matricula', '==', matricula).get().then( querySnapshot => {

		if ( querySnapshot.empty ) {
			return res.status(200).json({
				ok: true,
				message: 'No hay tickets del usuario con la matrícula ' + matricula,
				tickets
			});
		}

		var i = 0;
		querySnapshot.forEach( ticket => {
			tickets.push( ticket.data() );
			tickets[i].id = ticket.id;
			i++;
		});

		return res.status(200).json({
			ok: true,
			tickets
		});

	}).catch( err => {
		console.log(err);
		return res.status(500).json({
			ok: false,
			tickets,
			error: err
		});
	});
});


// ====================================================== //
// =============== OBTENER TICKETS POR ID =============== //
// ====================================================== //
app.get('/:ticketID', mdAuthentication.esAdminOSuperOAlumnoOProfesor, (req, res) => {

	console.log('GET - Consultando Ticket por su ID');

	var respuesta;
	var ticketID = req.params.ticketID;
	var ticket = {};

	console.log(ticketID);

	ticketsRef.doc(ticketID).get().then( documentSnapshot => {

		if ( !documentSnapshot.exists ) {
			respuesta = new ObjetoResponse( 404, false, 'No existe el ticket con el id ' + ticketID, { ticket }, null);
			return res.status(respuesta.code).json(respuesta.response);
		}

		
		ticket = documentSnapshot.data();
		ticket.id = documentSnapshot.id;

		respuesta = new ObjetoResponse( 200, true, null, { ticket }, null);
		respuesta.consoleLog();
		return res.status(respuesta.code).json(respuesta.response);
		
	}).catch( err => {

		console.log(err);
		respuesta = new ObjetoResponse( 500, false, 'Error al consultar ticket', { ticket }, null);
		respuesta.consoleLog();
		return res.status(respuesta.code).json(respuesta.response);

	});
});


// ====================================================== //
// =========== OBTENER TODOS LOS TICKETS ================ //
// ====================================================== //
/**
 * Possible Query Params:
 *  - laboratorio
 *  - equipo
 *  - estadoEncuesta
 */
app.get('/', mdAuthentication.esAdminOSuper, (req, res) => {
	console.log('GET - Consultando todos los tickets');
	var respuesta;

	// Query Params
	var laboratorio = req.query.laboratorio;
	var equipo = req.query.equipo;
	var encuestaEstado = req.query.encuestaEstado;
	var tickets = [];
	
	// Query
	var query = ticketsRef;
	
	if ( laboratorio ) {
		console.log(laboratorio);
		query = query.where('laboratorio', '==', laboratorio);
	}
	if ( equipo ) {
		console.log(equipo);
		query = query.where('equipo.id', '==', equipo);
	}
	if ( encuestaEstado ) {
		console.log(encuestaEstado);
		query = query.where('encuesta.estado', '==', Number(encuestaEstado));
	}

	query.get().then( querySnapshot => {
		if ( querySnapshot.empty ) {
			respuesta = new ObjetoResponse( 200, true, 'No hay tickets registrados', { tickets }, null );
			return res.status(respuesta.code).json(respuesta.response);
		}
		var i = 0;
		querySnapshot.forEach( ticket => {
			tickets.push( ticket.data() );
			tickets[i].id = ticket.id;
			i++;
		});

		respuesta = new ObjetoResponse( 200, true, null, { tickets }, null );
		respuesta.consoleLog();
		return res.status(respuesta.code).json(respuesta.response);
	}).catch( err => {
		console.log(err);
		respuesta = new ObjetoResponse( 500, false, 'Error al consultar todos los tickets', { tickets }, null );
		respuesta.consoleLog();
		return res.status(respuesta.code).json(respuesta.response);
	});
});




// ====================================================== //
// =================== CREAR TICKET ================== //
// ====================================================== //
app.post('/', mdAuthentication.esAlumnoOProfesor, (req, res)=>{
	console.log('  - Creando ticket... - ');
	var ticket = req.body.ticket;
	console.log(ticket);

	var respuesta = new ObjetoResponse(500, false, 'Internal Server Error', null, null);

	ticketsRef.add( ticket ).then( docReference => {
		respuesta = new ObjetoResponse(200, true, 'Ticket creado', null, null);
		respuesta.consoleLog();
		return res.status(respuesta.code).json(respuesta.response);
	}).catch( err => {
		console.log(err);
		respuesta.error = err;
		respuesta.consoleLog();
		return res.status(respuesta.code).json(respuesta.response);
	});
});


// ====================================================== //
// ================= MODIFICAR TICKET ================ //
// ====================================================== //
app.put('/', mdAuthentication.esAdminOSuper, (req, res)=>{

	var ticket = req.body.ticket;
	var id = ticket.id;

	ticketsRef.doc( id ).set( ticket, { merge: true } ).then( () => {
		return res.status(200).json({
			ok: true
		});
	}).catch( err => {
		console.log(err);
		return res.status(500).json({
			ok: false,
			error: err
		});
	});
});

// ====================================================== //
// =================== ACTUALIZAR CHAT ================== //
// ====================================================== //
app.put('/:id/chat', mdAuthentication.esAdminOAlumnoOProfesor, (req, res)=>{
	var ticket = req.body.ticket;
	var id = req.params.id;

	console.log('PUT - Actualizando chat ' + ticket.titulo + ' (' + id + ')');

	ticketsCtrl.updateChat( id, ticket ).then( respuesta => {
		respuesta.consoleLog();
		return res.status( respuesta.code ).json( respuesta.response );
	}).catch( respuesta => {
		respuesta.consoleLog();
		return res.status( respuesta.code ).json( respuesta.response );
	});
});


// ====================================================== //
// ================= ACTUALIZAR ENCUESTA ================ //
// ====================================================== //
app.put('/encuesta/:id', mdAuthentication.esAlumnoOProfesor, (req, res) => {
	console.log('PUT - Actualizando encuesta de ticket');

	ticketsCtrl.setEncuesta( req.params.id, req.body.encuesta ).then( respuesta => {
		respuesta.consoleLog();
		return res.status( respuesta.code ).json( respuesta.response );
	}).catch( respuesta => {
		respuesta.consoleLog();
		return res.status( respuesta.code ).json( respuesta.response );
	});
});


// ====================================================== //
// ================== ACTUALIZAR ESTADO ================= //
// ====================================================== //
app.put('/estado/:id', mdAuthentication.esAdminOSuper, (req, res) => {
	console.log('PUT - Actualizando estado de ticket');

	ticketsCtrl.updateEstado( req.params.id, req.body.estado ).then( respuesta => {
		respuesta.consoleLog();
		return res.status( respuesta.code ).json( respuesta.response );
	}).catch( respuesta => {
		respuesta.consoleLog();
		return res.status( respuesta.code ).json( respuesta.response );
	});
});



// ====================================================== //
// ==================== ELIMINAR TICKET ================= //
// ====================================================== //
app.delete('/:id', mdAuthentication.esAdminOSuper, (req, res) => {
	var id = req.params.id;

	ticketsRef.doc(id).delete().then( () => {

		return res.status(200).json({
			ok: true,
			message: 'Ticket eliminada'
		});
	}).catch( err => {
		return res.status(500).json({
			ok: false,
			error: err
		});
	});
});


module.exports = app;
