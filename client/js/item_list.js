(function(exports) {
	var socker = require("xio-socker");
	var list;
	var items = [];
	var config = require("./config");
	var storage;

	function init(storageClass) {
		storage = storageClass;
		list = document.querySelector(".shopping-list");
		list.addEventListener("change", onListChange, false);
		list.addEventListener("click", onListClick, false);

		socker.on("allItems", allItemsCallback);
		socker.on("newItems", newItemsCallback);
		refreshList();
	}

	function allItemsCallback(serverItems) {
		console.log("AllItemsFromServer", serverItems);

		storage.getAll("items", "_id").then(items => {
			var existingIds = items.map(item => item._id);
			var itemsToAdd = serverItems.filter(item => {
				return existingIds.indexOf(item._id) === -1;
			});

			/*
				TODO:
				STORAGE CAN ONLY SAVE ONE ITEM AT A TIME
				Promisify save and create an array of saves 
				then run Promise.all(array) to save all at once
				ONLY one db.open and get store!!
			*/

			itemsToAdd.forEach((item, i) => {
				storage.save("items", item).then(id => {
					if(i === itemsToAdd.length-1) refreshList();
				});
			});
		});
	}

	
	function onListChange(e) {
		console.log("listChange", e);
		var elem = e.target;
		var storageId = parseInt(elem.parentElement.dataset.storageId);

		storage.get(config.storageName, storageId).then(function(item) {
			item.checked = elem.checked;
			storage.update(config.storageName, item).then(function() {
				notifyServiceWorker();
				refreshList();
			});
		});
	}


	function onListClick(e) {
		console.log("list click", e.target);

		var elem = e.target;
		while(elem !== list) {
			if(elem.className === "button-delete-item") {
				var storageId = parseInt(elem.parentElement.dataset.storageId);
				deleteItem(storageId);
			}
			elem = elem.parentElement;
		}
	}

	function deleteItem(storageId) {
		var elem = list.querySelector(".shopping-list-item[data-storage-id='"+storageId+"']");
		storage.get(config.storageName, storageId).then(function(item) {
			if(item.localOnly) {
				storage.delete(config.storageName, storageId).then(function(e) {
					elem.parentElement.classList.add("delete");
				});
			} else {
				item.deleted = true;
				storage.update(config.storageName, item).then(function(e) {
					console.log("deleted flag set", e);
					notifyServiceWorker();
					refreshList();
				});
			}
		});
	}


	function newItemsCallback(newItems) {
		newItems.forEach((newItem, i) => {
			storage.save("items", newItem).then(item => {
				console.log("new item saved", item);
				if(i === newItems.length-1) refreshList();
			});
		});
	}


	function refreshList() {
		console.log("Refresh list");
		storage.getAll(config.storageName).then(function(items) {
			list.innerHTML = items.sort(sortByName).map(getItemHTML).join("");
		});
	}


	function getItemHTML(item) {
		var elemId = "item_"+item._id;
		var checked = item.checked ? "checked" : "";
		var itemClasses = "shopping-list-item";
		if(item.localOnly) itemClasses += " local";
		if(item.deleted) itemClasses += " deleted";
		return `
			<li class="${itemClasses}" data-storage-id="${item.id}">
				<input type="checkbox" name="${item._id}" id="${elemId}" ${checked} />
				<label for="${elemId}">&#10003;</label>
				<span class="name">${item.name}</span>
				<button type="button" class="button-delete-item">
					<svg class="icon icon-delete"><use xlink:href="/icon/icons.svg#icon-delete"></use></svg>
				</button>
			</li>
		`;
	}


	function addItem(name) {
		var tempId = -(+new Date());
		var item = {name: name, _id:tempId, localOnly:true};
		console.log("Save item:", item);
		storage
			.save(config.storageName, item)
			.then(function(e) {
				console.log("Saved to idb", item);
				refreshList(); 
				notifyServiceWorker();
			});
	}


	function notifyServiceWorker() {
		console.log("wanna synk");
		navigator.serviceWorker.ready
			.then(function(registration) {
				return registration.sync.register('itemsToSync')})
			.then(function() {
				console.log("synk scheduled...");
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