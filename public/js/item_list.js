var ItemList = (function() {
	var items = [];
	var list = document.querySelector(".shopping-list");
	Socker.on("allItems", allItemsCallback);



	function allItemsCallback(it) {
		items = it;
		refreshList();
	}


	function refreshList() {
		list.innerHTML = "";
		items.forEach(createListItem);
	}

	function createListItem(item, i) {
		var li = document.createElement("li");
		li.textContent = item.name;
		li.dataset.id = item._id;
		li.className = "shopping-list-item";
		list.appendChild(li);
	}



	return {

	}
}());