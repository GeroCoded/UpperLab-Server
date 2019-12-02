
module.exports.DOMINIO_CORREO = '@upemor.edu.mx';

module.exports.MENSAJES_DE_ERROR = {
	1: 'No se enviaron todos los datos del usuario',
	2: 'El correo no pertenece a la Universidad Politécnica del Estado de Morelos.',
	3: 'La matrícula y el correo no coinciden'
};

module.exports.BREAK_MESSAGE = 'BREAK';

// WARNING: NO CAMBIAR LA CONFIGURACIÓN DE ROLES.
module.exports.ROLES = {
	ALUMNO: 1,
	PROFESOR: 2,
	ADMINISTRADOR: 3,
	SUPERADMINISTRADOR: 4
};

module.exports.ESTADOS_TICKET = {
	NUEVO: 1,
	EN_PROCESO: 2,
	RESUELTO: 3,
	NO_RESUELTO: 4,
	CANCELADO: 5
};

module.exports.ESTADOS_ENCUESTA = {
	NO_DISPONIBLE: 0,
	DISPONIBLE: 1,
	CONTESTADA: 2
};

module.exports.MATRICULA_WOLFBOT = 'WOLFBOT1423';


const colecciones = {
	alumnos: 'alumnos',
	clases: 'clases',
	fcmTokens: 'fcmTokens',
	grupos: 'grupos',
	laboratorios: 'laboratorios',
	tickets: 'tickets',
	admins: 'admins',
	bitacoras: 'bitacoras',
	carreras: 'carreras',
	clasificaciones: 'clasificaciones',
	componentes: 'componentes',
	edificios: 'edificios',
	equipos: 'equipos',
	plantillas: 'plantillas',
	preguntas: 'preguntas',
	profesores: 'profesores',
	solicitudes: 'solicitudes',
	superadmins: 'superadmins'
};

const subcolecciones = {
	'NO-AUTORIZADO': 'NO-AUTORIZADO'
};

const coleccionesArrayA = [
	colecciones.alumnos,
	colecciones.clases,
	colecciones.fcmTokens,
	colecciones.grupos,
	colecciones.laboratorios,
	colecciones.tickets
];

const coleccionesArrayB = [
	colecciones.admins,
	colecciones.bitacoras,
	colecciones.carreras,
	colecciones.clasificaciones,
	colecciones.componentes,
	colecciones.edificios,
	colecciones.equipos,
	colecciones.plantillas,
	colecciones.preguntas,
	colecciones.profesores,
	colecciones.solicitudes,
	colecciones.superadmins
];

module.exports.COLECCIONES = colecciones;
module.exports.SUBCOLECCIONES = subcolecciones;
module.exports.COLECCIONES_A_ARR = coleccionesArrayA;
module.exports.COLECCIONES_B_ARR = coleccionesArrayB;

module.exports.getBD = function getBD( coleccion ) {
	if ( coleccionesArrayA.includes(coleccion) ) {
		return require('firebase-admin').firestore();
	} else if ( coleccionesArrayB.includes(coleccion) ) {
		const { secondAdmin } = require('../index');
		return secondAdmin.firestore();
	}
};
