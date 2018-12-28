var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var Client = require("vicconnect-client");
var client = new Client("vc-web-dash", "Victory Connect Web Dash");

client.enableTCP();

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){
  console.log('a user connected');
  client.setTickRate(100);
  client.subscribe("*", (packet)=>{
      io.emit("topic",packet);
  })

  client.registerCommand("test/web/alert",(packet)=>{
    io.emit("alert", packet.data[0]);
  })
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});