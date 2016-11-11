var Datastore = require('nedb-promise');
var db = new Datastore({
	filename: 'server/item_store',
	autoload: true
});



function getAll() {
	return db.find({});
}


function insert(item) {
	return db.insert(item);
}

function update(id, data) {
	return db.update({_id: id}, {$set: data});

}

function remove(id) {
	return db.remove({_id: id});
}

function removeItems(ids) {
	return db.remove({ _id: {$in: ids}}, {multi: true});
}



module.exports = {
	getAll: getAll,
	insert: insert,
	update: update,
	remove: remove,
	removeItems: removeItems
};