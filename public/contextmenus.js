window.addEventListener("load",initiate);
//where to show the contextmenu
function getAndShowMenu(x,y,z){
	cat = z.id+"menu";//make it clear whose contextmenu it is
	var el = document.getElementById(cat);
	el.style.left=x+"px";el.style.top=y+"px";
	el.style.position="absolute"; el.style.display="block";
	el.addEventListener('mouseout',initiateDismiss);
}

//try to dismiss contextmenu when click out range
function dismiss(){
	if(event.target != el){
	hideAll();
	document.removeEventListener('click',dismiss);
	el = 0;	}
}

function initiateDismiss(){
	el=event.target;
	document.addEventListener('click',dismiss)
	el.removeEventListener('mouseout',initiateDismiss);
}
//....................

//at the beginning, do not show the contextmenu
function hideAll(){
	var w = document.getElementsByClassName("contextmenu");
	for(i=0;i<w.length;i++) {
	w[i].style.display="none";
};}


function initiate(){
	hideAll();
	var w = document.getElementsByClassName("contextmenu");
	for(i=0;i<w.length;i++) {
	var cat = w[i].id.slice(0,-4);// the content of the contextmenu defined by user
	document.getElementById(cat).style.cursor="context-menu";
	document.getElementById(cat).addEventListener('contextmenu', function(ev) {
	ev.preventDefault();// prevent the defaut right click menu
	hideAll();
	//user right click position
	var x = ev.clientX -2+window.pageXOffset;
	var y = ev.clientY-2+window.pageYOffset;
	var z = ev.target;
	getAndShowMenu(x,y,z);
	return false;
}, false);// prevent the defaut right click menu, too. have to return false
};}
