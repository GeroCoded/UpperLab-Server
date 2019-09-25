var express = require('express');
var firestore = require('firebase-admin').firestore();
var mdAuthentication = require('./middlewares/authentication');

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
// =================== CREAR TICKET ================== //
// ====================================================== //
app.post('/', /*mdAuthentication.esAdminOSuper,*/ (req, res)=>{

	var ticket = req.body.ticket;
	console.log(req.body);
	console.log(ticket);

	ticketsRef.add( ticket ).then( docReference => {
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
