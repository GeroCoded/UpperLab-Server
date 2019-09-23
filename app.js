// Requires
var express = require('express');

var fileUpload = require('express-fileupload');

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


// Middleware de express-fileupload
app.use(fileUpload());

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
var superadminRoutes = require('./routes/superadmin');
var laboratorioRoutes = require('./routes/laboratorio');
var claseRoutes = require('./routes/clase');
var edificioRoutes = require('./routes/edificio');
var carreraRoutes = require('./routes/carrera');
var descargasRoutes = require('./routes/descargas');
var asistenciasRoutes = require('./routes/asistencia');
var equipoRoutes = require('./routes/equipo');
var componenteRoutes = require('./routes/componente');
var plantillaRoutes = require('./routes/plantilla');

app.use('/login', loginRoutes);
app.use('/alumno', alumnoRoutes);
app.use('/profesor', profesorRoutes);
app.use('/admin', adminRoutes);
app.use('/superadmin', superadminRoutes);
app.use('/laboratorio', laboratorioRoutes);
app.use('/clase', claseRoutes);
app.use('/edificio', edificioRoutes);
app.use('/carrera', carreraRoutes);
app.use('/descargas', descargasRoutes);
app.use('/asistencia', asistenciasRoutes);
app.use('/componente', componenteRoutes);
app.use('/equipo', equipoRoutes);
app.use('/plantilla', plantillaRoutes);

// Escuchar peticiones del express
app.listen(3000, '0.0.0.0', ()=>{
	console.log('Express server puerto 3000: \x1b[32m%s\x1b[0m', 'online');
});