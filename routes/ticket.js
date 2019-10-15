var express = require('express');
var firestore = require('firebase-admin').firestore();
var mdAuthentication = require('./middlewares/authentication');
var ObjetoResponse = require('../models/objetoResponse');

var app = express();


const ticketsRef = firestore.collection('tickets');



// ====================================================== //
// =========== OBTENER TICKETS POR MATRICULA ============ //
// ====================================================== //
app.get('/:matricula', /*mdAuthentication.esAdminOSuper,*/ (req, res) => {

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
// =========== OBTENER TODOS LOS TICKETS ================ //
// ====================================================== //
app.get('/' /*,mdAuthentication.esAdminOSuper */, (req, res) => {
	var tickets = [];
	ticketsRef.get().then( querySnapshot => {
		if ( querySnapshot.empty ) {
			return res.status(200).json({
				ok: true,
				message: 'No hay tickets',
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
