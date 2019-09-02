var express = require('express');

var app = express();

app.get('/alumnosFormato', (req, res)=>{
	const file = `${__dirname}/../formatos/alumnosFormato.xlsx`;
	console.log(file);
	res.download(file);
});

app.get('/profesoresFormato', (req, res)=>{
	const file = `${__dirname}/../formatos/profesoresFormato.xlsx`;
	console.log(file);
	res.download(file);
});

module.exports = app;
