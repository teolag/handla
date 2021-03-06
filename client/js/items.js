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

function getSortedPosition(id) {
	return getAllSorted().findIndex(i => i._id === id);
}

function getCheckedCount() {
	return items.filter(i => i.checked).length;
}
function getTotalCount() {
	return items.length;
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
	getSortedPosition: getSortedPosition,
	set: set,
	check: checkItem,
	uncheck: uncheckItem,
	saveToCache: saveToCache,
	loadFromCache: loadFromCache,
	getCheckedCount: getCheckedCount,
	getTotalCount: getTotalCount
};
