module.exports = {
	port: 8080,
	cert: __dirname + '/cert.pem',
	certKey: __dirname + '/key.pem',
	websocket: {
		allowedOrigin: "http://handla",
		allowedProtocol: "handla"
	}
}