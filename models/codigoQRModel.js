var crypto = require('crypto');
var key = crypto.createHash('sha256').update(String('upperlab')).digest('base64').substr(0, 32);

class CodigoQRModel {
	constructor () {
		this.equipoID = '';
		this.laboratorio = '';
	}

	encrypt( decrypted ) {
		const iv = crypto.randomBytes(16);
		var text = JSON.stringify({ equipoID: decrypted.equipoID, laboratorio: decrypted.laboratorio });
		var cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key), iv);
		var encrypted = cipher.update(text);
		encrypted = Buffer.concat([encrypted, cipher.final()]);
		return JSON.stringify({ iv: iv.toString('hex'), encryptedData: encrypted.toString('hex') });
	}

	decrypt( encrypted ) {
		console.log(encrypted);
		var json = JSON.parse(encrypted);
		var iv = Buffer.from(json.iv, 'hex');
		var encryptedText = Buffer.from(json.encryptedData, 'hex');
		var decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key), iv);
		var decrypted = decipher.update(encryptedText);
		decrypted = Buffer.concat([decrypted, decipher.final()]);
		var decryptedJson = JSON.parse(decrypted.toString());
		console.log(decryptedJson);
		this.equipoID = decryptedJson.equipoID;
		this.laboratorio = decryptedJson.laboratorio;
	}

}

module.exports = CodigoQRModel;