
var express = require('express');

var authController = require('../controllers/authentication');
var userCRUD = require('../controllers/userCRUD');

var app = express();


app.get('/', (req, res) => {

	return userCRUD.obtenerTodosLosUsuarios('profesores', 'profesor', res);
	
});

app.get('/eliminar/:matricula', (req, res) => {

	return userCRUD.eliminarUsuario('profesores', 'profesor', req, res);
	
});

app.post('/crear/', (req, res) => {

	return userCRUD.crearUsuario('profesores', 'profesor', req, res);
	
});

app.put('/modificar/', (req, res) => {

	return userCRUD.modificarUsuario('profesores', 'profesor', req, res);
	
});


module.exports = app;