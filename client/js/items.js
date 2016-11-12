var items = [];


function set(arr) {
	items = arr;
}

function addItem(item) {
	items.push(item);
}


function deleteItem(id) {
	var index = items.findIndex(i => i._id === id);
	items.splice(index, 1);
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
	set: set
	/*
	saveToCache: {console.error("Not implemented")},
	loadFromCache: {console.error("Not implemented")}
	*/
};
