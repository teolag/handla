var IDB = require("./storage");
var db = new IDB('handla', 1, upgrade);
const STORE_NAME = "offlineMessages";

function upgrade(e) {
	console.log("upgrade db");
	var objectStore = e.target.result.createObjectStore(STORE_NAME, {autoIncrement: true});
}


function saveMessage(type, data) {
	var message = {type:type, data:data, ts: new Date()};
	db.insert(STORE_NAME, message).then(e => {
		navigator.serviceWorker.ready.then(function(swRegistration) {
			console.log("Tell SW to sync");
  			return swRegistration.sync.register('offlineChanges');
		});
	});
}

function hasChanges() {
	return new Promise(function(resolve, reject) {
		db.getAll(STORE_NAME).then(messages => {
			if(messages.length>0) {
				resolve(true);
			} else {
				resolve(false);
			}
		});
	});
}


module.exports = {
	saveMessage: saveMessage,
	hasChanges: hasChanges
}