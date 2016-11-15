var items = [];


function set(arr) {
	items = arr;
	saveToCache();
}

function addItem(item) {
	items.push(item);
	saveToCache();
}


function deleteItem(id) {
	var index = items.findIndex(i => i._id === id);
	items.splice(index, 1);
	saveToCache();
}

function checkItem(id) {
	var item = items.find(i => i._id === id);
	item.checked = true;
	saveToCache();
}

function uncheckItem(id) {
	var item = items.find(i => i._id === id);
	item.checked = false;
	saveToCache();
}

function saveToCache() {
	 localStorage.setItem('items', JSON.stringify(items));
}

function loadFromCache() {
	var cache = JSON.parse(localStorage.getItem('items'));
	if(cache) items = cache;
}


function getAllSorted() {
	return items.sort(sortByName);
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


module.exports = {
	add: addItem,
	delete: deleteItem,
	getAllSorted: getAllSorted,
	set: set,
	check: checkItem,
	uncheck: uncheckItem,
	saveToCache: saveToCache,
	loadFromCache: loadFromCache
};
