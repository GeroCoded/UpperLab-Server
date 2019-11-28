
const mdAuthentication = require('./middlewares/authentication');
const ObjetoResponse = require('./../models/objetoResponse');

// Firestore
const firestore = require('firebase-admin').firestore();
const { secondAdmin } = require('../index');
const { firestoreExport, firestoreImport } = require('node-firestore-import-export');
const { COLECCIONES_A_ARR, COLECCIONES_B_ARR } = require('../config/config');

const auth = require('firebase-admin').auth();

// File System
const fs = require('fs');
// Zip-A-Folder package
const { zip } = require('zip-a-folder');

// ExpressJs
const express = require('express');
const app = express();


/**
 * Verificar la existencia del respaldo y devolver los datos sobre cuándo se
 * realizó el último.
 */
app.get('/existe', mdAuthentication.esSuperadmin, (req, res) => {

	try {
		const backupDataJSON = JSON.parse( fs.readFileSync('./data/backupData.json') );
		respuesta = new ObjetoResponse(200, true, 'Existe respaldo', { backupData: backupDataJSON }, null);
		
	} catch( error ) {
		respuesta = new ObjetoResponse(200, false, 'Aún no se ha respaldado la BD', null, null);
	}

	return res.status(respuesta.code).json(respuesta.response);
	
});

/**
 * Exportar y guardar las colecciones de Firestore en archivos JSON.
 */
app.get('/', mdAuthentication.esSuperadmin, (req, res) => {

	const token = req.query.token;
	console.log('token', token);

	let respuesta = new ObjetoResponse(500, false, 'Server Internal Error', null, null);

	let promesas = [];
	
	// Primera Base de datos
	COLECCIONES_A_ARR.forEach( coleccion => {
		let collectionRef = firestore.collection(coleccion);
		promesas.push( firestoreExport(collectionRef) );
	});

	// Segunda Base de datos
	COLECCIONES_B_ARR.forEach( coleccion => {
		let collectionRef = secondAdmin.firestore().collection(coleccion);
		promesas.push( firestoreExport(collectionRef) );
	});

	const coleccionesJuntas = [...COLECCIONES_A_ARR,...COLECCIONES_B_ARR];

	Promise.all( promesas ).then( respuestas => {
		
		respuestas.forEach( (jsonData, i) => {

			fs.writeFileSync(`./data/${ coleccionesJuntas[i] }.json`, JSON.stringify(jsonData), { flag: 'w' }, (err) => {
				console.log(i, err);
			});
			
		});

		return auth.verifyIdToken( token );

	}).then( decodedIdToken => {


		const backupData = {
			last: new Date().toString(),
			user: decodedIdToken.name
		};

		fs.writeFileSync(`./data/backupData.json`, JSON.stringify(backupData), { flag: 'w' }, (err) => {
			console.log(err);
		});

		respuesta = new ObjetoResponse(200, true, 'Respaldo de la base de datos exitoso', { backupData }, null);
		return res.status(respuesta.code).json(respuesta.response);
		
	}).catch( err => {
		console.log(err);
		respuesta.error = err;
		return res.status( respuesta.code ).json( respuesta.response );
	});
	
});

/**
 * Descargar el grupo colecciones (archivos JSON) en un archivo ZIP.
 */
app.get('/descargar', mdAuthentication.esSuperadmin, (req, res) => {

	console.log('Descargando colecciones...');
	
	zip('./data', './upperlab-collections.zip').then( respuesta => {

		const file = `${__dirname}/../upperlab-collections.zip`;
		console.log(file);
		return res.download(file);

	}).catch( err => {
		console.log(err);
	});
});


module.exports = app;
