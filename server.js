/**
 * Created by ArH on 2016/11/12.
 */

let express = require('express');
let app     = express();

let bodyParser = require('body-parser');
let server     = require('http').Server(app);
let io         = require('socket.io')(server);
// 加载http接口
let api        = require('./server/api');
let stats      = require('./server/queue/stats');

//release

//可配置项
let port = 8081;

server.listen(port);
app.use(bodyParser.json());
api(app);





let socket_count = 0, one_intervel;
io.on('connection', function (socket) {
    socket_count++;

    stats();
    io.sockets.emit('stats', global.global_stats); // 广播

    // 取数据 只创建一次 每用户便销毁
    if (socket_count == 1) {
        one_intervel = setInterval(function () {
            stats();
            io.sockets.emit('stats', global.global_stats); // 广播
        }, 1200);
    }

    console.log(`${socket.id} connection`);
    socket.on('disconnect', function () {
        socket_count--;
        if(socket_count==0){
            clearInterval(one_intervel);
        }
        console.log(`${socket.id} disconnect`);
    });

});

