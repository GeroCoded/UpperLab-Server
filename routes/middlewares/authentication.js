
var auth = require('firebase-admin').auth();

exports.verificarToken = function verificarToken(req, res, next) {

	var token = req.query.token;

	auth.verifyIdToken(token)
	.then( (decodedToken)=>{

		// next(decodedToken);
		next();
		
	})
	.catch( err=>{
		return res.status(401).json({
			ok: false,
			message: 'Token inválido',
			errors: err
		});
	});
	// auth.verifyIdToken();
};


exports.esAdmin = function esAdmin(req, res, next) {
	auth.verifyIdToken(idToken)
	.then( (decodedToken)=>{
		if ( decodedToken.isAdmin ) {
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
			message: 'Token inválido',
			errors: err
		});
	});
};

