var express = require('express');
var router = express.Router();
var itemDB = require('./database');
var socker = require('xio-socker');


router.post("/syncItems", syncItems);
router.use(express.static('public'));


socker.on("newItem", function(con, data, type) {
	var item = {name: data.name, added: new Date(), changed: new Date()};
	itemDB.insert(item).then(function(newItem) {
		console.log("item inserted", newItem);
		socker.sendToAll("newItem", newItem);
	});
});

socker.on("deleteItem", function(con, data, type) {
	itemDB.remove(data).then(function(item) {
		console.log("item removed");
		socker.sendToAll("deleteItem", data);
	});
});

socker.on("checkItem", function(con, data, type) {
	itemDB.update(data, {checked:true}).then(function(e) {
		console.log("item checked", data);
		socker.sendToAll("itemChecked", data);
	});
});

socker.on("uncheckItem", function(con, data, type) {
	itemDB.update(data, {checked:false}).then(function(e) {
		console.log("item unchecked", data);
		socker.sendToAll("itemUnchecked", data);
	});
});

socker.on("getAllItems", function(con, data, type) {
	itemDB.getAll().then(function(docs) {
		socker.sendTo(con, "allItems", docs);
	});
});

module.exports = router;










function syncItems(req, res) {
	console.log("synca items", req.body);

	var newItems = req.body.newItems.map(function(item) {
		return {
			name: item.name,
			added: new Date(), 
			changed: new Date()
		}
	});

	var	savedTempIds = req.body.newItems.map(function(item) {
		return item._id;
	});

	var insertPromise = itemDB.insert(newItems).then(function(insertedItems) {
		console.log("Inserted items", insertedItems);
		socker.sendToAll("newItems", insertedItems);
	});

	var itemIdsToDelete = req.body.itemIdsToDelete;
	console.log("remova", itemIdsToDelete);
	var deletePromise = itemDB.removeItems(itemIdsToDelete)
		.then(function() {console.log("bortta");});

	Promise.all([insertPromise, deletePromise]).then(function(returns) {
		console.log("Both completed", returns);
		res.json({savedTempIds: savedTempIds, deletedIds: itemIdsToDelete});
	});
}