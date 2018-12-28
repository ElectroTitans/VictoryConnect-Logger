$(function () {
    
    var socket = io();
    var showing = {};

    var dps = []; // dataPoints
    var toGraph = "";
    var chart = null;


    var xVal = 0;
    var yVal = 0;
    var updateInterval = 100;
    var dataLength = 50; // number of dataPoints visible at any point

    var rawData = [];
    var avg = 0;
    var min = 0;
    var max = 0;
   
    function resetGraph() {
        avg = 0;
        rawData = [];
        min = 0;
        max = 0;
        xVal = 0;
        dps = [];
        chart = new CanvasJS.Chart("chartContainer", {
            animationEnabled: true,
            title: {
                text: toGraph
            },
            axisY: {
                includeZero: false,
                stripLines: [{
                    value: max,
                    label: "Average"
                }]
            },
            data: [{
                type: "spline",
                dataPoints: dps
            }]
        });

    }
    var chartStats = new Vue({
        el: '#chart-stats',
        data: {
            min: 0,
            max: 0,
            avg: 0
        }
    })

    var netStats = new Vue({
        el: '#net-stats',
        data: {
            packets: 0,
            tickRate: 0
        }
    })

    var commandSend = new Vue({
        el: "#command-send",
        data:{
            path: "",
            data: []
        },
        methods: {
            send: function(path,data){
                data = data.split(",");
                console.log("Sending: " + path + " " + data)
                socket.emit("command_send", {path: path, data: data});
            }
        }
    })

    socket.on("stats", (data)=>{
        Vue.set(netStats, "packets", data.packets)
        Vue.set(netStats, "tickRate", data.tickRate)
    })

    setInterval(() => {
        var sum = 0;
        if (!rawData || rawData.length == 0) {
            return;
        }
        for (var i = 0; i < rawData.length; i++) {
            sum += rawData[i];
            if (rawData[i] > max || max == 0) {
                max = rawData[i];
                Vue.set(chartStats, "max", max);
            }

            if (rawData[i] < min || min == 0) {
                min = rawData[i];
                Vue.set(chartStats, "min", min);
            }
        }
        avg = sum / rawData.length;
     
        dps.push({
            x: xVal,
            y: avg
        });
        
        xVal++;
        if (dps.length > dataLength) {
            dps.shift();
        }

        if (xVal > 2000) {
            xVal = 0;
        }

        avg = 0;


        if (chart) {
            chart.render();
        }

        rawData = [];

        var dpsSum = 0;
        var dpsAvg = 0;
        for(var i=0;i<dps.length;i++){
            dpsSum += parseFloat(dps[i].y);
        }

        dpsAvg = dpsSum / dps.length;

        chart.options.axisY.stripLines[0].value = dpsAvg;
        Vue.set(chartStats, "avg", dpsAvg);

    }, 100);
    var index = 0;
    var rawTable = new Vue({
        el: '#raw-table',
        data: {
            topics: {
                
            }
        },
        methods: {
            setGraph: function (e) {
              toGraph = e;
              resetGraph()
            }
       }
    })

    

    socket.on('topic', function (packet) {
        Vue.set(rawTable.topics, packet.path,{
            path: packet.path,
            value: packet.data,
            lastUpdated: new Date().getHours() + ":"+ new Date().getMinutes() + ":" + new Date().getSeconds() + "" + new Date().getMilliseconds()
        });

        if (packet.path == toGraph) {
            var val = parseFloat(packet.data[0]);

            if (val != NaN || val != undefined) {
                rawData.push(val);

            } else {
            
            }

            if (rawData.length > 100) {
                rawData.shift();
            }

        }
    
    })


})