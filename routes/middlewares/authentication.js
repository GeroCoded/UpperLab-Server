
var auth = require('firebase-admin').auth();


var PERMISOS_INSUFICIENTES = {
	ok: false,
	message: 'Permisos insuficientes para realizar esta acción'
};

exports.esAdmin = function esAdmin(req, res, next) {
	
	var token = req.query.token;

	if( token === null || token === undefined ) {
		return res.status(401).json(PERMISOS_INSUFICIENTES);
	}

	return auth.verifyIdToken(token).then( (claims)=>{
		if ( claims.isAdmin ) {
			return next();
		} else {
			return res.status(401).json(PERMISOS_INSUFICIENTES);
		}
	}).catch( err => {
		return res.status(401).json({
			ok: false,
			message: 'Sesión caducada.',
			errors: err
		});
	});
};

exports.esAdminOSuper = function esAdminOSuper(req, res, next) {
	
	var token = req.query.token;

	if( token === null || token === undefined ) {
		return res.status(401).json(PERMISOS_INSUFICIENTES);
	}

	return auth.verifyIdToken(token).then( (claims)=>{
		if ( claims.isAdmin || claims.isSuperadmin ) {
			return next();
		} else {
			return res.status(401).json(PERMISOS_INSUFICIENTES);
		}
	}).catch( err => {
		return res.status(401).json({
			ok: false,
			message: 'Sesión caducada.',
			errors: err
		});
	});
};

exports.esSuperadmin = function esSuperadmin(req, res, next) {
	
	var token = req.query.token;

	if( token === null || token === undefined ) {
		return res.status(401).json(PERMISOS_INSUFICIENTES);
	}

	return auth.verifyIdToken(token).then( (claims)=>{
		if ( claims.isSuperadmin ) {
			return next();
		} else {
			return res.status(401).json(PERMISOS_INSUFICIENTES);
		}
	}).catch( err => {
		return res.status(401).json({
			ok: false,
			message: 'Sesión caducada.',
			errors: err
		});
	});
};


exports.esAlumno = function esAlumno(req, res, next) {
	
	var token = req.query.token;

	if( token === null || token === undefined ) {
		return res.status(401).json(PERMISOS_INSUFICIENTES);
	}

	return auth.verifyIdToken(token).then( (claims)=>{
		if ( claims.isAlumno ) {
			return next();
		} else {
			return res.status(401).json(PERMISOS_INSUFICIENTES);
		}
	}).catch( err=>{
		return res.status(401).json({
			ok: false,
			message: 'Sesión caducada.',
			errors: err
		});
	});
};


exports.esProfesor = function esProfesor(req, res, next) {
	
	var token = req.query.token;

	if( token === null || token === undefined ) {
		return res.status(401).json(PERMISOS_INSUFICIENTES);
	}

	return auth.verifyIdToken(token).then( (claims)=>{
		if ( claims.isProfesor ) {
			return next();
		} else {
			return res.status(401).json(PERMISOS_INSUFICIENTES);
		}
	}).catch( err=>{
		return res.status(401).json({
			ok: false,
			message: 'Sesión caducada.',
			errors: err
		});
	});
};


exports.esAlumnoOProfesor = function esAlumnoOProfesor(req, res, next) {
	
	var token = req.query.token;

	if( token === null || token === undefined ) {
		return res.status(401).json(PERMISOS_INSUFICIENTES);
	}

	return auth.verifyIdToken(token).then( (claims)=>{
		if ( claims.isAlumno || claims.isProfesor ) {
			return next();
		} else {
			return res.status(401).json(PERMISOS_INSUFICIENTES);
		}
	}).catch( err=>{
		return res.status(401).json({
			ok: false,
			message: 'Sesión caducada.',
			errors: err
		});
	});
};


exports.esAdminOSuperOAlumno = function esAdminOSuperOAlumno(req, res, next) {
	
	var token = req.query.token;

	if( token === null || token === undefined ) {
		return res.status(401).json(PERMISOS_INSUFICIENTES);
	}

	return auth.verifyIdToken(token).then( (claims)=>{
		if ( claims.isAdmin || claims.isSuperadmin || claims.isAlumno) {
			return next();
		} else {
			return res.status(401).json(PERMISOS_INSUFICIENTES);
		}
	}).catch( err => {
		return res.status(401).json({
			ok: false,
			message: 'Sesión caducada.',
			errors: err
		});
	});
};


exports.esAdminOAlumnoOProfesor = function esAdminOAlumnoOProfesor(req, res, next) {
	
	var token = req.query.token;

	if( token === null || token === undefined ) {
		return res.status(401).json(PERMISOS_INSUFICIENTES);
	}

	return auth.verifyIdToken(token).then( (claims)=>{
		if ( claims.isAdmin || claims.isAlumno || claims.isProfesor ) {
			return next();
		} else {
			return res.status(401).json(PERMISOS_INSUFICIENTES);
		}
	}).catch( err => {
		return res.status(401).json({
			ok: false,
			message: 'Sesión caducada.',
			errors: err
		});
	});
};

exports.esAdminOSuperOAlumnoOProfesor = function esAdminOSuperOAlumnoOProfesor(req, res, next) {
	
	var token = req.query.token;

	if( token === null || token === undefined ) {
		return res.status(401).json(PERMISOS_INSUFICIENTES);
	}

	return auth.verifyIdToken(token).then( (claims)=>{
		if ( claims.isAdmin || claims.isSuperadmin || claims.isAlumno || claims.isProfesor ) {
			return next();
		} else {
			return res.status(401).json(PERMISOS_INSUFICIENTES);
		}
	}).catch( err => {
		return res.status(401).json({
			ok: false,
			message: 'Sesión caducada.',
			errors: err
		});
	});
};

