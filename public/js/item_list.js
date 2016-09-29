var ItemList = (function() {
	var items = [];
	var list = document.querySelector(".shopping-list");
	list.addEventListener("change", listChange, false);
	Socker.on("allItems", allItemsCallback);
	Socker.on("newItem", newItemCallback);
	loadCachedList();
	sendAllLocalItems();
	

	function sendAllLocalItems() {
		console.log("any local items?");
		items.filter(function(item) {
			return item.localOnly;
		}).forEach(function(item) {
			console.log("send local", item);
			Socker.send("addItem", item);
		});
	}


	function listChange(e) {
		console.log("listChange", e);
		var itemId = e.target.name;

		var item = items.find(function(item) {
			return item._id === itemId;
		});
		if(item) {
			item.checked = e.target.checked;
			Socker.send("itemChecked", {id:itemId, checked:item.checked});
		}

	}


	function loadCachedList() {
		var cachedList = JSON.parse(localStorage.getItem("items"));
		if(cachedList) {
			items = cachedList;
			refreshList();
		}
	}

	function saveCacheList() {
		localStorage.setItem("items", JSON.stringify(items));
	}



	function allItemsCallback(it) {
		items = it;
		saveCacheList();
		refreshList();
	}

	function newItemCallback(item) {
		var localItem = items.find(function(local) {
			return local._id === item.tempId && local.localOnly;
		});
		if(localItem) {
			console.log("local item saved to db", item);
			localItem.localOnly = false;
			localItem._id = item._id;
		} else {
			items.push(item);
		}

		saveCacheList()
		refreshList();
	}

	function refreshList() {
		list.innerHTML = "";
		items.sort(sortByName);
		items.forEach(createListItem);
	}

	function createListItem(item, i) {
		var li = document.createElement("li"),
			label = document.createElement("label"),
			checkbox = document.createElement("input"),
			nameSpan = document.createElement("span"),
			deleteButton = document.createElement("span");
		checkbox.type = "checkbox";
		checkbox.name = item._id;
		nameSpan.textContent = item.name;
		deleteButton.textContent = "x";
		label.appendChild(checkbox);
		label.appendChild(nameSpan);
		label.appendChild(deleteButton);
		li.dataset.id = item._id;
		li.className = "shopping-list-item";
		li.appendChild(label);

		if(item.localOnly) li.classList.add("local");
		list.appendChild(li);
	}

	function addItem(name) {
		var tempId = "temp"+(+new Date());
		var item = {name: name, _id:tempId, localOnly:true};
		items.push(item);
		Socker.send("addItem", item);
		saveCacheList();
		refreshList(); 
	}


	function sortByName(a, b) {
		if(a.name > b.name) {
			return 1;
		} else if(a.name < b.name) {
			return -1;
		}
		return 0;
	}


	return {
		add: addItem
	}
}());