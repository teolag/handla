module.exports = {
	port: 55555,
	cert: __dirname + '/cert.pem',
	certKey: __dirname + '/key.pem',
	websocket: {
		allowedOrigin: "http://handla",
		allowedProtocol: "handla"
	}
}