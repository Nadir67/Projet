/**************************************
 
  excuter les données et tester l'application 
  Meteor avec node.js
 
 *************************************/

var http = require('http');// inclure le module http
// on crée une variable appelée options qui contient tous les parametres de la demande.
var options = {

	hostname: 'localhost',// le nom de domaine ou adresse IP du serveur auquel la demande doit etre adressér
	port: 3000, // port du serveur distant
	path: '/api/points', // chemin de la demande
	method: 'POST' // une chaine specifiant la methode de requêtes HTTP
	
};

var now;
var temperature;
var humidity;
var t;
var req = null;

setInterval(function() {
// construire la requete avec des options et une fonction de rappel.
	req = http.request(options, function(res) {
		console.log('STATUS: ' + res.statusCode);
		console.log('HEADERS: ' + JSON.stringify(res.headers)); // un objet contenant des en-têtes de requete et de  convertis en chaine JSON
		res.setEncoding('utf8');//  L'utilisation de req.setEncoding ('utf8') décode automatiquement les octets d'entrée en chaîne,
		res.on('data', function (chunk) {
			console.log('BODY: ' + chunk);
		});
	});

	req.on('error', function(e) {
		console.log('problem with request: ' + e.message);
	});

	// écrire des données pour demander le corps
	temperature = Math.floor((Math.random() * 110) + 1);;// la fonction Math.random renvoie un nombre entier aleatoire de (0 a 99)+1
	humidity = Math.floor((Math.random() * 110) + 1);;
	now = new Date();
	console.log('Time:', now, 'Degrees:', temperature + 'F', 'Humidity:', humidity + '%RH');
	t = {
		temp: temperature,
		humidity: humidity,
		time: now.toJSON()
	};
	req.write(JSON.stringify(t));
	// indique que on a terminé avec la demande
	req.end();

}, 2000);// l'incrémentation chaque 2000 ms