
exports.stringsToCamelSpacedCase = function stringsToCamelSpacedCase( strings ) {
	strings = strings.split(' ');
	strings = strings.map( string => {
		string = string.toLowerCase();
		return string.charAt(0).toUpperCase() + string.slice(1);
	});
	return strings.join(' ');
}