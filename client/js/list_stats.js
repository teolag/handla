var elem = document.querySelector(".list-stats");
var Items = require("./items");
	
function update() {
	var checkedCount = Items.getCheckedCount();
	var totalCount = Items.getTotalCount();
	elem.innerHTML = `${checkedCount} / ${totalCount}`;
}


module.exports = {
	update: update
}
