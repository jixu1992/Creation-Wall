var canvas;
var canvasWidth = 480;
var canvasHeight = 220;
var context;
var paint = false;
var clickX = new Array();
var clickY = new Array();
var clickDrag = new Array();
var drawingAreaX = 111;
var drawingAreaY = 11;
var drawingAreaWidth = 600;//
var drawingAreaHeight = 400;//
var canvas;
var context;
var paint_color = new Array();
var paintcolor=0;
//.............................drag the canvas div
var canvasDraw = $('#canvasDiv');

canvasDraw.offset({
    left: 100,
    top: 75
});

var drag = {
    elem: null,
    x: 0,
    y: 0,
    state: false
};
var delta = {
    x: 0,
    y: 0
};

canvasDraw.mousedown(function(e) {
    if (!drag.state&&e.which==3) {
        drag.elem = this;
        this.style.backgroundColor = '#f00';
        drag.x = e.pageX;
        drag.y = e.pageY;
        drag.state = true;
				console.log("right click");
    }
    return false;
});


$(document).mousemove(function(e) {
    if (drag.state&&e.which==3) {
        drag.elem.style.backgroundColor = '#f0f';

        delta.x = e.pageX - drag.x;
        delta.y = e.pageY - drag.y;

        // $('#log').text(e.pageX + ' ' + e.pageY + ' ' + delta.x + ' ' + delta.y);

        var cur_offset = $(drag.elem).offset();

        $(drag.elem).offset({
            left: (cur_offset.left + delta.x),
            top: (cur_offset.top + delta.y)
        });

        drag.x = e.pageX;
        drag.y = e.pageY;
    }
});

$(document).mouseup(function() {
    if (drag.state) {
        drag.elem.style.backgroundColor = '#808';
        drag.state = false;
    }
});

//..........................................

function CreateCanvas(){
	canvas = document.createElement('canvas');
	canvas.setAttribute('width',canvasWidth);
	canvas.setAttribute('height',canvasHeight);
	canvas.setAttribute('id','canvas');
}

function CreateContext(){

	context = document.getElementById('canvas').getContext("2d");

	//Set the background color of the canvas
	context.beginPath();
	context.rect(drawingAreaX, drawingAreaY, drawingAreaWidth, drawingAreaHeight);
	context.fillStyle="#fff0f5";
	context.fill();
	// console.log("context");

	$('#canvas').mousedown(function(e){
		switch(e.which){
			case 1:
			var mouseX = e.pageX - this.offsetLeft;
			var mouseY = e.pageY - this.offsetTop;
			paint = true;
			addClick(mouseX,mouseY,false);
			redraw();
			break;
			case 3:
			clickX=[];
			clickY=[];
			clickDrag=[];
			paint_color=[];
			paint=false;
			redraw();
			break;
		}

	});

	$('#canvas').click(function(e){

	});

	$('#canvas').mousemove(function(e){
		if(paint==true){
			addClick(e.pageX - this.offsetLeft, e.pageY - this.offsetTop, true);
			redraw();
		}
	});

	$('#canvas').mouseup(function(e){
		paint = false;
	});

	$('#canvas').mouseleave(function(e){
		paint = false;
	});

}

function prepareCanvas(){
	var canvasDiv = document.getElementById('canvasDiv');
	// canvas = document.createElement('canvas');
	// canvas.setAttribute('width',canvasWidth);
	// canvas.setAttribute('height',canvasHeight);
	// canvas.setAttribute('id','canvas');
  CreateCanvas();
	canvasDiv.appendChild(canvas);
	CreateContext();
	// context = document.getElementById('canvas').getContext("2d");

	//Set the background color of the canvas
	// context.beginPath();
	// context.rect(drawingAreaX, drawingAreaY, drawingAreaWidth, drawingAreaHeight);
	// context.fillStyle="#fff0f5";
	// context.fill();
	//
	// $('#canvas').mousedown(function(e){
	// 	switch(e.which){
	// 		case 1:
	// 		var mouseX = e.pageX - this.offsetLeft;
	// 		var mouseY = e.pageY - this.offsetTop;
	// 		paint = true;
	// 		addClick(mouseX,mouseY,false);
	// 		redraw();
	// 		break;
	// 		case 3:
	// 		clickX=[];
	// 		clickY=[];
	// 		clickDrag=[];
	// 		paint=false;
	// 		redraw();
	// 		break;
	// 	}
	//
	// });
	//
	// $('#canvas').click(function(e){
	//
	// });
	//
	// $('#canvas').mousemove(function(e){
	// 	if(paint==true){
	// 		addClick(e.pageX - this.offsetLeft, e.pageY - this.offsetTop, true);
	// 		redraw();
	// 	}
	// });
	//
	// $('#canvas').mouseup(function(e){
	// 	paint = false;
	// });
	//
	// $('#canvas').mouseleave(function(e){
	// 	paint = false;
	// });
}

function addClick(x,y,dragging){
	clickX.push(x);
	clickY.push(y);
	clickDrag.push(dragging);
	paint_color.push(paintcolor);
}

function clearCanvas(){
	context.clearRect(0,0,canvasWidth,canvasHeight);
}

function redraw(){
	//clearCanvas();

	context.save();
	context.beginPath();
	context.rect(drawingAreaX, drawingAreaY, drawingAreaWidth, drawingAreaHeight);
	context.fillStyle="#fff0f5";
	context.fill();

	context.clip();//clip the defined drawing area, users cannot draw outside this area
	context.beginPath();
	context.strokeStyle = "#9370DB";
	context.lineJoin = "round";
	context.lineWidth = 5;
	for(var i=0; i < clickX.length; i++){
		context.beginPath();
		if(clickDrag[i] && i){
			context.moveTo(clickX[i-1], clickY[i-1]);
		}
		else{
			context.moveTo(clickX[i], clickY[i]);//
		}
		switch (paint_color[i]) {
			case 1:
				context.strokeStyle = "#4CAF50";//Green
				break;
		    case 2:
	 			context.strokeStyle = "#008CBA";//Blue
	 			break;
			case 3:
				context.strokeStyle = "#696969";//Gray
				break;
			case 4:
				context.strokeStyle = "#f44336";//Red
				break;
			case 5:
				context.strokeStyle = "#000000";//Black
				break;

			default:
			context.strokeStyle = "#9370DB";

		}
		context.lineTo(clickX[i], clickY[i]);
		context.closePath();
		context.stroke();
	}

	context.restore();
}

$(document).ready(function(){
	 $("#addDraw").click(function () {
		  console.log("here");
      var $div = $('div[id^="canvasDiv"]:first');
			CreateCanvas();
			$newDiv = $div.clone().append(canvas);
			CreateContext();
      $newDiv.appendTo("body");
	 });

	 $("#green").click(function () {
		  console.log("green");
      	paintcolor=1;
	 });

	 $("#blue").click(function () {
		  paintcolor=2;

	 });

	 $("#gray").click(function () {
		  paintcolor=3;

	 });

	 $("#red").click(function () {
		  paintcolor=4;

	 });

	 $("#black").click(function () {
		 paintcolor=5;

	 });


});
