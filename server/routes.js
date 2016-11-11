var express = require('express');
var router = express.Router();
var itemDB = require('./database');
var socker = require('xio-socker');


router.post("/syncItems", syncItems);
router.use(express.static('public'));


socker.on("itemDelete", function(con, data, type) {
	itemDB.remove(data.id).then(function(data) {
		console.log("item removed", err);
		socker.sendToAll("deletedItem", data.id);
	});
});

socker.on("itemChecked", function(con, data, type) {
	itemDB.update(data.id, {checked:data.checked}).then(function(e) {
		console.log("item " + (data.checked? "checked": "unchecked"), e);
		socker.sendToAll("checkedItem", data);
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