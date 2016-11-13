var list;
var Items = require("./items");
var Websocket = require("./websocket");


function init(elem) {
	list = elem;
	list.addEventListener("change", onListChange, false);
	list.addEventListener("click", onListClick, false);
}


function refresh() {
	console.log("Refresh list");
	list.innerHTML = Items.getAllSorted().map(generateHTML).join("");
}



Websocket.on("allItems", items => {
	console.log("All items from server", items);
	Items.set(items);
	refresh();
});
Websocket.on("newItem", item => {
	console.log("New item from server:", item);
	Items.add(item);
	refresh();
});
Websocket.on("deleteItem", itemId => {
	console.log("Delete item from server:", itemId);
	Items.delete(itemId);
	refresh();
});
Websocket.on("itemChecked", itemId => {
	Items.check(itemId);
	refresh();
});
Websocket.on("itemUnchecked", itemId => {
	Items.uncheck(itemId);
	refresh();
});




function generateHTML(item) {
	var elemId = "item_"+item._id;
	var checked = item.checked ? "checked" : "";
	var itemClasses = "shopping-list-item";
	if(item.localOnly) itemClasses += " local";
	if(item.deleted) itemClasses += " deleted";
	return `
		<li class="${itemClasses}" data-item-id="${item._id}">
			<input type="checkbox" name="${item._id}" id="${elemId}" ${checked} />
			<label for="${elemId}">&#10003;</label>
			<span class="name">${item.name}</span>
			<button type="button" class="button-delete-item">
				<svg class="icon icon-delete"><use xlink:href="/icon/icons.svg#icon-delete"></use></svg>
			</button>
		</li>
	`;
}


function onListChange(e) {
	//console.log("listChange", e);
	var elem = e.target;
	var itemId = elem.parentElement.dataset.itemId;
			
	Websocket.send(elem.checked ? "checkItem" : "uncheckItem", itemId);
}


function onListClick(e) {
	//console.log("list click", e.target);

	var elem = e.target;
	while(elem !== list) {
		if(elem.className === "button-delete-item") {
			var itemId = elem.parentElement.dataset.itemId;
			Websocket.send("deleteItem", itemId);
			break;
		}
		elem = elem.parentElement;
	}
}


module.exports = {
	init: init,
	refresh: refresh
};







/*

(function(exports) {
	var socker = require("xio-socker");
	var _items = [];
	var config = require("./config");
	
	

	

	
	


	

	function newItemCallback(newItem) {
		_items.push(newItem);
		refreshList();
	}


	


	function addItem(name) {
		console.log("Save item:", item);
		if(socker.connected()) {
			
		} else {
			//TODO: put message in indexedDb send queue
		}
	}


	function notifyServiceWorker() {
		console.log("wanna synk");
		navigator.serviceWorker.ready
			.then(function(registration) {
				console.log("ready to sync");
				return registration.sync.register('itemsToSync')})
			.then(function() {
				console.log("synk scheduled...");
			}).catch(function(e) {
				console.log("no sync!", e);
			});
	}


	function sortByName(a, b) {
		let n1 = a.name.toLowerCase(),
			n2 = b.name.toLowerCase();
		if(n1 > n2) {
			return 1;
		} else if(n1 < n2) {
			return -1;
		}
		return 0;
	}

	exports.init = init;
	exports.add = addItem;
	exports.sync = notifyServiceWorker;
	exports.refresh = refreshList;
	
}(typeof exports === 'undefined'? this['ItemList']={}: exports));

*/