import http from 'http';
var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);

// Socket IO Setup
server.listen(8080);
io.on('connection', (socket) => {
  socket.emit('msg', { hello: 'world' });
  socket.on('cmd', (data) => {
    console.log(data);
  });
});

// Server Creation
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Hello World\n');
}).listen(1337, '127.0.0.1');

console.log('Server running at http://127.0.0.1:1337/');
