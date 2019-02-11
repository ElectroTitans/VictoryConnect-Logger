var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var Client = require("vicconnect-client");
var client = new Client("vc-web-dash", "Victory Connect Web Dash");
var tickRate = 50;
var packets = 0;

client.useMDNS((ip, port) => {
  client.enableTCP(ip, port);
}, () => { })

client.on("ready", () => {
  client.setTickRate(tickRate);
  client.subscribe("*", (packet) => {
    io.emit("topic", packet);
    packets++;
  })

  client.registerCommand("test/web/alert", (packet) => {
    io.emit("alert", packet.data[0]);
  })
})

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

app.get('/web_script.js', function (req, res) {
  res.sendFile(__dirname + '/web_script.js');
});

io.on('connection', function (socket) {
  console.log('a user connected');

 

  socket.on("command_send", (packet) => {
    console.log("Sending Command: ", packet);
    client.callCommand(packet.path, packet.data);
  })

  setInterval(() => {
    io.emit("stats", {
      tickRate: tickRate,
      packets: packets
    });
  }, 1000)
});

http.listen(3000, function () {
  console.log('listening on *:3000');
});