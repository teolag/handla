var list;
var Items = require("./items");
var Websocket = require("./websocket");
var offlineChanges = require("./offline_changes");



function init(elem) {
	list = elem;
	list.addEventListener("click", onListClick, false);
	Items.loadFromCache();
	refresh();
}


function refresh() {
	console.log("Refresh list");
	var items = Items.getAllSorted();
	if(items.length === 0) {
		list.innerHTML = "<li>Tomt!</li>";
	} else {
		list.innerHTML = items.map(generateHTML).join("");
	}
}



Websocket.on("allItems", items => {
	console.log("All items from server", items);

	offlineChanges.hasChanges().then(hasChanges => {
		if(hasChanges) {
			console.log("do not update items until sync is complete");
		} else {
			console.log("no offline changes, load items");
			Items.set(items);
			refresh();
		}
	});
});
Websocket.on("newItem", item => {
	console.log("New item from server:", item);
	Items.add(item);
	var sortedIndex = Items.getSortedPosition(item._id);
	var li = generateHTML(item);
	if(sortedIndex === 0) {
		list.insertAdjacentHTML('afterbegin', li);
	} else {
		let previousLi = list.children.item(sortedIndex-1);
		previousLi.insertAdjacentHTML('afterend', li)
	}
});
Websocket.on("deleteItem", itemId => {
	console.log("Delete item from server:", itemId);
	Items.delete(itemId);
	refresh();
});
Websocket.on("itemChecked", itemId => {
	Items.check(itemId);
	check(itemId);
	//refresh();
});
Websocket.on("itemUnchecked", itemId => {
	Items.uncheck(itemId);
	uncheck(itemId);
	//refresh();
});




function generateHTML(item) {
	var elemId = "item_"+item._id;
	var itemClasses = "shopping-list-item";
	if(item.localOnly) itemClasses += " local";
	if(item.deleted) itemClasses += " deleted";
	if(item.checked) itemClasses += " checked";
	return `
		<li class="${itemClasses}" data-item-id="${item._id}">
			<button type="button" class="button-check-item">
				<svg class="icon icon-check"><use xlink:href="/icon/icons.svg#icon-check"></use></svg>
			</button>
			<span class="name">${item.name}</span>
			<button type="button" class="button-delete-item">
				<svg class="icon icon-delete"><use xlink:href="/icon/icons.svg#icon-delete"></use></svg>
			</button>
		</li>
	`;
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

		if(elem.className === "button-check-item") {
			var li = elem.parentElement;
			var itemId = li.dataset.itemId;
			var checked = li.classList.contains("checked");
			Websocket.send(!checked ? "checkItem" : "uncheckItem", itemId);
			break;
		}

		elem = elem.parentElement;
	}
}

function check(id) {
	var li = list.querySelector("li[data-item-id='"+id+"']");
	li.classList.add("checked");
}
function uncheck(id) {
	var li = list.querySelector("li[data-item-id='"+id+"']");
	li.classList.remove("checked");
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