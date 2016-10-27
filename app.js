var express = require('express'),
    app = express(),
    http = require('http'),
    socketIo = require('socket.io');

//web socket server running on port 8080
var server =  http.createServer(app);
var io = socketIo.listen(server);
server.listen(8080);

// add directory with our static files
app.use(express.static(__dirname + '/public'));
console.log("Server running on port 8080");

// array of all lines drawn
var line_history = [];
// array of all images
var image_history= [];

// event-handler for new incoming connections
io.on('connection', function (socket) {

   // first send the history to the new client
   for (var i in line_history) {
      socket.emit('draw_line', { line: line_history[i] } );
   }
   for (var j in image_history) {
      socket.emit('add_image', { image: image_history[j] } );//iamge consist of url, x, y
   }


   // add handler for message type "draw_line".
   socket.on('draw_line', function (data) {
      // add received line to history
      line_history.push(data.line);
      // send line to all clients
      io.emit('draw_line', { line: data.line });
   });
   socket.on('add_image', function (data) {
      // add received line to history
      image_history.push(data.image);
      // send line to all clients
      io.emit('add_image', { image: data.image });
   });

   //add handler for message type "clear".
   socket.on('clear', function () {
        socket.broadcast.emit('clear');
        //clear the history of lines drawn
        line_history = [];
        image_history= [];
    });
});
