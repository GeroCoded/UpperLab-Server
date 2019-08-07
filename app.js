// Requires
var express = require('express');

var bodyParser = require('body-parser');

// FIREBASE ADMIN SDK
var admin = require('firebase-admin');
var serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
	credential: admin.credential.cert(serviceAccount),
	databaseURL: 'https://upperlab-e81d9.firebaseio.com'
});



// var mongoose = require('mongoose');

// Inicializar variables
var app = express();


// 
app.use(function(req, res, next) {
	res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	res.header("Access-Control-Allow-Methods", "POST, GET, PUT, DELETE, OPTIONS");
	next();
});
  



// ~~~~~~~~~~~~~ Body Parser ~~~~~~~~~~~~~ //
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false})); 
// parse application/json
app.use(bodyParser.json());


var loginRoutes = require('./routes/login');
var alumnoRoutes = require('./routes/alumno');
var profesorRoutes = require('./routes/profesor');
var adminRoutes = require('./routes/admin');

app.use('/login', loginRoutes);
app.use('/alumno', alumnoRoutes);
app.use('/profesor', profesorRoutes);
app.use('/admin', adminRoutes);

// Escuchar peticiones del express
app.listen(3000, ()=>{
	console.log('Express server puerto 3000: \x1b[32m%s\x1b[0m', 'online');
});