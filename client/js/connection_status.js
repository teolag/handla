var elem = document.querySelector(".connection-status");
	
function hideAll() {
	Array.from(elem.children).forEach(div => {
		div.setAttribute("hidden","");
	});
}

function setStatus(status) {
	hideAll();
	elem.querySelector('.' + status).removeAttribute("hidden");
}


module.exports = {
	setStatus: setStatus
}
