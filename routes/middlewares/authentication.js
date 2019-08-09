
var auth = require('firebase-admin').auth();

exports.verificarToken = function verificarToken(req, res, next) {

	var token = req.query.token;

	auth.verifyIdToken(token)
	.then( (decodedToken)=>{

		next();
		
	})
	.catch( err => {
		return res.status(401).json({
			ok: false,
			message: 'Sesión caducada.',
			errors: err
		});
	});
};


exports.esAdmin = function esAdmin(req, res, next) {
	
	var token = req.query.token;

	auth.verifyIdToken(token)
	.then( (claims)=>{
		console.log(claims);
		if ( claims.isAdmin ) {
			next();
		} else {
			return res.status(401).json({
				ok: false,
				message: 'Permisos insuficientes para realizar esta acción'
			});
		}
	})
	.catch( err=>{
		return res.status(401).json({
			ok: false,
			message: 'Sesión caducada.',
			errors: err
		});
	});
};

exports.esAdminOSuper = function esAdminOSuper(req, res, next) {
	
	var token = req.query.token;

	auth.verifyIdToken(token)
	.then( (claims)=>{
		console.log(claims);
		if ( claims.isAdmin || claims.isSuperadmin ) {
			next();
		} else {
			return res.status(401).json({
				ok: false,
				message: 'Permisos insuficientes para realizar esta acción'
			});
		}
	})
	.catch( err=>{
		return res.status(401).json({
			ok: false,
			message: 'Sesión caducada.',
			errors: err
		});
	});
};

exports.esSuperadmin = function esSuperadmin(req, res, next) {
	
	var token = req.query.token;

	auth.verifyIdToken(token)
	.then( (claims)=>{
		console.log(claims);
		if ( claims.isSuperadmin ) {
			next();
		} else {
			return res.status(401).json({
				ok: false,
				message: 'Permisos insuficientes para realizar esta acción'
			});
		}
	})
	.catch( err=>{
		return res.status(401).json({
			ok: false,
			message: 'Sesión caducada.',
			errors: err
		});
	});
};


exports.esAlumno = function esAlumno(req, res, next) {
	
	var token = req.query.token;

	auth.verifyIdToken(token)
	.then( (claims)=>{
		console.log(claims);
		if ( claims.isAlumno ) {
			next();
		} else {
			return res.status(401).json({
				ok: false,
				message: 'Permisos insuficientes para realizar esta acción'
			});
		}
	})
	.catch( err=>{
		return res.status(401).json({
			ok: false,
			message: 'Sesión caducada.',
			errors: err
		});
	});
};


exports.esProfesor = function esProfesor(req, res, next) {
	
	var token = req.query.token;

	auth.verifyIdToken(token)
	.then( (claims)=>{
		console.log(claims);
		if ( claims.isProfesor ) {
			next();
		} else {
			return res.status(401).json({
				ok: false,
				message: 'Permisos insuficientes para realizar esta acción'
			});
		}
	})
	.catch( err=>{
		return res.status(401).json({
			ok: false,
			message: 'Sesión caducada.',
			errors: err
		});
	});
};

