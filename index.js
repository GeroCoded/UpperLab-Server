// Requires
const express = require('express');
const fileUpload = require('express-fileupload');
const bodyParser = require('body-parser');

// Inicializar variables
const app = express();


// ---------------  IMPORTACIÓN DE SOCKET IO ----------------//
const socketIO = require('socket.io');
const http = require('http');

// Creando servidor 
let server = http.createServer(app);

//IO es la comunicación directa del backend
module.exports.io = socketIO(server);
require('./sockets/socket-servidor');


// FIREBASE ADMIN SDK
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
	credential: admin.credential.cert(serviceAccount),
	databaseURL: 'https://upperlab-e81d9.firebaseio.com'
});


// Middleware de express-fileupload
app.use(fileUpload());


app.use( (req, res, next) => {
	// res.header("Access-Control-Allow-Origin", "https://upperlab-e81d9.firebaseapp.com"); // update to match the domain you will make the request from
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


var alumnoRoutes = require('./routes/alumno');
var profesorRoutes = require('./routes/profesor');
var adminRoutes = require('./routes/admin');
var superadminRoutes = require('./routes/superadmin');
var laboratorioRoutes = require('./routes/laboratorio');
var claseRoutes = require('./routes/clase');
var edificiosRoutes = require('./routes/edificios');
var carrerasRoutes = require('./routes/carreras');
var descargasRoutes = require('./routes/descargas');
var asistenciasRoutes = require('./routes/asistencia');
var equipoRoutes = require('./routes/equipo');
var componenteRoutes = require('./routes/componente');
var plantillaRoutes = require('./routes/plantilla');
var ticketRoutes = require('./routes/ticket');
var gruposRoutes = require('./routes/grupos');
var topicsRoutes = require('./routes/topics');
var clasificacionesRoutes = require('./routes/clasificaciones');
var bitacorasRoutes = require('./routes/bitacoras');
var solicitudesRoutes = require('./routes/solicitudes');

app.use('/alumno', alumnoRoutes);
app.use('/profesor', profesorRoutes);
app.use('/admin', adminRoutes);
app.use('/superadmin', superadminRoutes);
app.use('/laboratorio', laboratorioRoutes);
app.use('/clase', claseRoutes);
app.use('/edificios', edificiosRoutes);
app.use('/carreras', carrerasRoutes);
app.use('/descargas', descargasRoutes);
app.use('/asistencia', asistenciasRoutes);
app.use('/componente', componenteRoutes);
app.use('/equipo', equipoRoutes);
app.use('/plantilla', plantillaRoutes);
app.use('/ticket', ticketRoutes);
app.use('/grupos', gruposRoutes);
app.use('/topics', topicsRoutes);
app.use('/clasificaciones', clasificacionesRoutes);
app.use('/bitacoras', bitacorasRoutes);
app.use('/solicitudes', solicitudesRoutes);

const port = process.env.PORT || 3000;

// Escuchar peticiones del express
server.listen(port, '0.0.0.0', ()=>{
	console.log(`Express server puerto ${port}: \x1b[32m%s\x1b[0m`, 'online');
});