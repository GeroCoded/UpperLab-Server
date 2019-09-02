
var auth = require('firebase-admin').auth();


var PERMISOS_INSUFICIENTES = {
	ok: false,
	message: 'Permisos insuficientes para realizar esta acción'
};

exports.esAdmin = function esAdmin(req, res, next) {
	
	var token = req.query.token;

	if( token == null ) {
		return res.status(401).json(PERMISOS_INSUFICIENTES);
	}

	auth.verifyIdToken(token).then( (claims)=>{
		if ( claims.isAdmin ) {
			next();
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

	if( token == null ) {
		return res.status(401).json(PERMISOS_INSUFICIENTES);
	}

	auth.verifyIdToken(token).then( (claims)=>{
		if ( claims.isAdmin || claims.isSuperadmin ) {
			next();
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

	if( token == null ) {
		return res.status(401).json(PERMISOS_INSUFICIENTES);
	}

	auth.verifyIdToken(token).then( (claims)=>{
		if ( claims.isSuperadmin ) {
			next();
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

	if( token == null ) {
		return res.status(401).json(PERMISOS_INSUFICIENTES);
	}

	auth.verifyIdToken(token).then( (claims)=>{
		if ( claims.isAlumno ) {
			next();
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

	if( token == null ) {
		return res.status(401).json(PERMISOS_INSUFICIENTES);
	}

	auth.verifyIdToken(token).then( (claims)=>{
		if ( claims.isProfesor ) {
			next();
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

