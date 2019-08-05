var express = require('express');
var auth = require('firebase-admin').auth();


var app = express();

app.post('/', (req, res)=>{

	
	auth.getUserByEmail(req.body.correo)
	.then( (usuario)=>{

		res.status(200).json({
			ok: true,
			usuario
		});
	})
	.catch( (err)=>{

		res.status(400).json({
			ok: false,
			message: 'Credenciales incorrectas',
			error: err
		});
	});
	
});

module.exports = app;
