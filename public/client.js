var paint = false;
var clickX = new Array();
var clickY = new Array();
var myGesture = new Array();

var drawPosiX;
var drawPosiY;
var drawPos=false;
var drawPosIndex= 1 ;

var addX;
var addY;

//event is fired when the document has been completely loaded and parsed
document.addEventListener("DOMContentLoaded", function(ev) {
    var mouse = {
      click: false,
      move: false,
      color: false,
      size: false,
      pos: {x:0, y:0},
      pos_prev: false
    };

   ev.preventDefault();

   // get canvas element and create context
  var canvas  = document.getElementById('drawing');
  var thickness = document.getElementById('thickness');
  var context = canvas.getContext('2d');
  var width   = window.innerWidth;
  var height  = window.innerHeight;
  var socket  = io.connect();
  var colorGlobal = "#FF69B4";//default color:paint
  var sizeGlobal = 3;//default size:3

  // set the initial values of the 2 drop down selecting menus
  document.getElementById("thickness").selectedIndex = 2;
  document.getElementById("color").selectedIndex = 0;

  // set canvas to full browser width/height
  canvas.width = width;
  canvas.height = height;

  // register mouse event handlers
  canvas.onmousedown = function(e){ 
    if(e.which!=3){mouse.click = true;} //avoid drawing when right clicked
  };
  canvas.onmouseup = function(e){ mouse.click = false; };

  canvas.onmousemove = function(e) {
    //avoid drawing when right clicked
    if(e.which!=3){
      mouse.pos.x = e.pageX-this.offsetLeft;
      mouse.pos.y = e.pageY-this.offsetTop;
      mouse.color = colorGlobal;
      mouse.size = sizeGlobal;
      mouse.move = true;
    }
  };

  // clear received from server
  socket.on('clear', function(data){
    $(".draggable").remove();
    context.clearRect(0,0,width, height);
  });

   // draw line received from server
	socket.on('draw_line', function (data) {
    var line = data.line;
    var checkValueThickness;
    var checkValueColor;

    //default brush style, size and color
    context.strokeStyle = "#FF69B4";//pink
    context.lineJoin = "round";
    context.lineWidth = 3;

    checkValueThickness=$("#thickness").val();
    checkValueColor=$("#color").val();

    //change the brush size
    if (checkValueThickness == 1){
      sizeGlobal = 1;
    }
    else if(checkValueThickness == 2){
      sizeGlobal = 2;
    }
    else if(checkValueThickness == 3){
      sizeGlobal = 3;
    }
    else if(checkValueThickness == 4) {
      sizeGlobal = 4;
    }
    else if(checkValueThickness == 5) {
      sizeGlobal = 5;
    }
    else if(checkValueThickness == 10) {
      sizeGlobal = 10;
    }
    else if(checkValueThickness == 20) {
      sizeGlobal = 20;
    }

    //change the brush color
    if(checkValueColor == 1){
      colorGlobal = "#FF69B4";//pink
    }
    else if(checkValueColor == 2){
      colorGlobal = "#87CEEB";//blue
    }
    else if(checkValueColor == 3){
      colorGlobal = "#FFA500";//orange
    }
    else if(checkValueColor == 4){
      colorGlobal = "#FF0000";//red
    }
    else if(checkValueColor == 5){
      colorGlobal = "#FFD700";//yellow
    }
    else if(checkValueColor == 6){
      colorGlobal = "#32CD32";//green
    }
    else if(checkValueColor == 7){
      colorGlobal = "#EE82EE";//violet
    }
    else if(checkValueColor == 8){
      colorGlobal = "#A0522D";//brown
    }
    else if(checkValueColor == 9){
      colorGlobal = "#000000";//black
    }
    else if(checkValueColor == 10){
      colorGlobal = "#FFFFFF";//white - eraser
    }

    //set the color and size of the line
    context.strokeStyle = line[2];
    context.lineWidth = line[3];

    //draw lines
    context.beginPath();
    context.moveTo(line[0].x , line[0].y );//
    context.lineTo(line[1].x , line[1].y );
    context.stroke();
  });

   // main loop, running every 5ms
  function mainLoop() {
  // check if the user is drawing
    if (mouse.click && mouse.move && mouse.pos_prev) {
       // send line to to the server
       socket.emit('draw_line', { line: [ mouse.pos, mouse.pos_prev, mouse.color, mouse.size] });
       mouse.move = false;
    }
    mouse.pos_prev = {x: mouse.pos.x, y: mouse.pos.y};
    setTimeout(mainLoop, 5);
  }
  mainLoop();
});


$('#drawing').click(function(e){
  if(e.which==1){
    var mouseX = e.pageX - this.offsetLeft;
    var mouseY = e.pageY;
    if(drawPos===true){
      var s="canvas_"+(drawPosIndex-1).toString();// canvas_1
      console.log(s);
      var temp= document.getElementById(s);
      temp.style.left=mouseX+'px';
      temp.style.top=mouseY+'px';
      console.log("got");
      drawPos=false;
    }
  }
});


//handle the right click
function onload(){
  var el = document.getElementById("drawing");
  el.addEventListener('contextmenu', function(ev) {
    ev.preventDefault();
    alert('success!');
    addX= ev.pageX-this.offsetLeft;
    addY= ev.pageY-this.offsetTop;
    console.log("right click");
    return false;
  }, false);
}

$('#drawing').mousedown(function(e){
  //left click
  if(e.which==1){
    var mouseX = e.pageX - this.offsetLeft;
    var mouseY = e.pageY - this.offsetTop;
    paint = true;
    clickY=[];
    clickX=[];
    console.log("big down");
  }
  //right click
  else if(e.which==3){
    addX= e.pageX-this.offsetLeft;
    addY= e.pageY-this.offsetTop;
    console.log("right click");
  }
});

$('#drawing').mouseup(function(e){
  var mouseX = e.pageX - this.offsetLeft;
  var mouseY = e.pageY - this.offsetTop;
  paint = false;
  console.log("mouse gesture down");
  recognizeStroke();
});

$('#drawing').mousemove(function(e){
  if(paint==true){
    var mouseX = e.pageX - this.offsetLeft;
    var mouseY = e.pageY - this.offsetTop;
    paint = true;
    addClick(mouseX,mouseY);
  }
});

function addClick(x,y){
	clickX.push(x);
	clickY.push(y);
}

//used to encapsulate the drawing part
/*function redraw(){
  var c = document.getElementById("drawing");
  var context = c.getContext("2d");
  context.beginPath();
	context.strokeStyle = "#9370DB";
	context.lineJoin = "round";
	context.lineWidth = 5;
	for(var i=0; i < clickX.length-1; i++){
    context.moveTo(clickX[i], clickY[i]);
    context.lineTo(clickX[i+1], clickY[i+1]);
	}
  context.closePath();
  context.stroke();
  console.log("size: "+ clickX.length);
}*/

// recognition of gestures
function recognizeStroke(){
  myGesture = [];
  for(var i=0; i < clickX.length; i++){
		 var mypoint = new $1.Point(clickX[i],clickY[i]);
     myGesture.push(mypoint);
	}
  console.log($1.recognize(myGesture));
  var resultStroke=$1.recognize(myGesture);

  //draw a cross to close window
  if(resultStroke.name=="x"){
    // alert("hi X!");
    close_window();
  }
  //draw a circle to start searching bar
  else if(resultStroke.name=="circle"){
    var button1 = document.getElementsByClassName("search-icon");
    searchToggle(button1, "click");
  }
  //draw a pigtail to close searching bar
  else if(resultStroke.name=="pigtail"){
    var button2 = document.getElementsByClassName("close");
    searchToggle(button2, "click");
  }
}

function close_window() {
  if (confirm("Close Window?")) {
    close();
  }
}

//to add text on the canvas
// function createText(){
//   var x = document.createElement("CANVAS");
//   var input = new CanvasInput({
//   canvas: x////////////////////////////////
// });
// }

//add image on the canvas
function createImage(){
  base_image = new Image();
  var name = prompt("Enter Url", "");
  if(name){
    base_image.src=name;

    base_image.onload = function(){
      var tempDiv= document.createElement("div");
      var urlString = 'url(' + name + ')';
      tempDiv.setAttribute("class","resizable draggable");
      //image size
      base_image.style.width="300px";
      base_image.style.height="auto";

      $(tempDiv).prepend(base_image);

      document.body.appendChild(tempDiv);
      $( function() {
        $(".draggable").draggable();
        $(".resizable").resizable();
      } );
      tempDiv.style="position:absolute; z-index:2";
      tempDiv.style.left=addX+"px";
      tempDiv.style.top =addY+"px";
    }
  }
}

//download user's work on the canvas
function download(){
  var toImage = document.getElementById("drawing");
  var dataURL = toImage.toDataURL('image/png');
  this.href = dataURL;
}

document.getElementById('saveJpg').addEventListener('click', download, false);

//clear the canvas
function clearCanvas(){
  var width   = window.innerWidth;
  var height  = window.innerHeight;
  var canvas  = document.getElementById('drawing');
  var context = canvas.getContext('2d');
  context.clearRect(0,0,width, height);
  $(".draggable").remove();
  io.connect().emit('clear');
}
