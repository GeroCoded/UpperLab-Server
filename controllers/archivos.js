
var xlsx = require('xlsx');

var AlumnoModel = require('../models/alumno');
var ProfesorModel = require('../models/profesor');
var AdminModel = require('../models/admin');
var SuperadminModel = require('../models/superadmin');

var MENSAJES_DE_ERROR = require('../config/config').MENSAJES_DE_ERROR;

exports.obtenerArchivoExcel = function obtenerArchivoExcel(req, res) {
	// Validar que se haya recibido el archivo
	if ( !req.files ) {
		return res.status(400).json({
			ok: false,
			message: 'No seleccionó nada',
			error: { message: 'Debe de seleccionar un archivo excel' }
		});
	}

	// Obtener la extension del archivo
	var excel = req.files.excel;
	var nombreSeparado = excel.name.split('.');
	var extension = nombreSeparado[ nombreSeparado.length - 1 ];

	// Lista de extensiones permitidas
	var extensionesPermitidas = ['xlsx'];
	
	// Checar si el archivo tiene una extensión permitida
	if ( extensionesPermitidas.indexOf( extension ) < 0 ) {
		return res.status(400).json({
			ok: false,
			message: 'Extensión no válida',
			error: { message: 'Las extensiones válidas son: ' + extensionesPermitidas.join(', ') }
		});
	}


	return excel;
};


exports.validarUsuariosDeExcel = function validarUsuariosDeExcel( excel, usuarioSingular, res ) {

	
	var wb = xlsx.read( excel.data, {cellDates: true} );
	var ws = wb.Sheets[ wb.SheetNames[0] ];


	var fomatoCompatible = true;
	var titulosTipo;

	// Tipos de los títulos (string, number, etc.) 
	if ( usuarioSingular === 'alumno') {
		titulosTipo = [ws.A1.t, ws.B1.t, ws.C1.t, ws.D1.t, ws.E1.t, ws.F1.t, ws.G1.t, ws.H1.t];
	} else if ( usuarioSingular === 'profesor' ) {
		titulosTipo = [ws.A1.t, ws.B1.t, ws.C1.t, ws.D1.t, ws.E1.t];
	}

	// Verificar si todos son strings.
	fomatoCompatible = titulosTipo.every( titulo => {
		return titulo === 's';
	});

	// Verificar nombres de los títulos
	// Estos campos son iguales para PROFESOR y ALUMNO
	if (ws.A1.v !== 'matricula' ||
		ws.B1.v !== 'nombre' ||
		ws.C1.v !== 'apellidoP' ||
		ws.D1.v !== 'apellidoM' ||
		ws.E1.v !== 'correo') {
		
		fomatoCompatible = false;
	}

	// Verificar campos extras para ALUMNO
	if ( usuarioSingular === 'alumno' ) {
		if (ws.F1.v !== 'generacion' ||
			ws.G1.v !== 'carrera' ||
			ws.H1.v !== 'grupo') {
			
			fomatoCompatible = false;
		}
	}

	// Checar si el formato del archivo excel es compatible
	if ( !fomatoCompatible ) {
		return res.status(400).json({
			ok: false,
			message: 'Formato no compatible',
			error: { message: 'El formato no es compatible. Le sugerimos descargar el formato compatible.' }
		});
	}

	var data = xlsx.utils.sheet_to_json( ws );

	var usuario;
	var customClaims;

	return data.map( (fila, index) => {

		customClaims = {
			isAlumno: false,
			isProfesor: false,
			isAdmin: false,
			isSuperadmin: false
		};

		// Determinar qué tipo de usuarios son
		switch ( usuarioSingular ) {
			case 'alumno':
				usuario = new AlumnoModel( fila, true );
				customClaims.isAlumno = true;
				usuario.customClaims = customClaims;
				break;
			case 'profesor':
				usuario = new ProfesorModel( fila, true );
				customClaims.isProfesor = true;
				usuario.customClaims = customClaims;
				break;
			case 'administrador':
				usuario = new AdminModel( fila, true );
				customClaims.isAdmin = true;
				usuario.customClaims = customClaims;
				break;
			case 'superadministrador':
				usuario = new SuperadminModel( fila, true );
				customClaims.isSuperadmin = true;
				usuario.customClaims = customClaims;
				break;
		}

		var numDeError = usuario.validarDatos();
	
		if ( numDeError !== 0 ) {
			console.log('Error con registro [' + (index+1) + ']');
			usuario.errores.push( MENSAJES_DE_ERROR[numDeError] );
		}

		return usuario;

	});
};