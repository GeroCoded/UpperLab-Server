
exports.copiarObjeto = function copiarObjeto( objeto ) {

	var nuevoObjeto = {};

	Object.keys( objeto ).forEach( propiedad => {
		if ( objeto.hasOwnProperty(propiedad) ) {
			nuevoObjeto[propiedad] = objeto[propiedad];
		}
	});
	return nuevoObjeto;	
};