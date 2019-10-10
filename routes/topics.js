const express = require('express');
const mdAuthentication = require('./middlewares/authentication');
const objectsController = require('../controllers/objects');
const topicsCtrl = require('../controllers/topics');
const app = express();


app.post('/', /*mdAuthentication.esAdminOSuper,*/ (req, res) => {
	
	topicsCtrl.suscribirATopic( req.body.tokens, req.body.topic ).then( () => {
		return res.status(200).json({
			status: 200,
			message: 'Suscripción exitosa'
		});
	}).catch( error => {
		console.log(error);
		return res.status(500).json({
			status: 500,
			message: 'Error subscribing to topic',
			error
		});
	});
});



module.exports = app;