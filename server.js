/**
 * Created by ArH on 2016/11/12.
 */

let cp      = require('child_process');
let express = require('express');
let app     = express();

let bodyParser = require('body-parser');
let server     = require('http').Server(app);
let io         = require('socket.io')(server);
// 加载http接口
let api        = require('./server/api');

//可配置项
let port = 8081;

server.listen(port);
app.use(bodyParser.json());
api(app);

io.on('connection', function (socket) {
    console.log(`${socket.id} connection`);
    socket.on('disconnect', function () {
        console.log(`${socket.id} disconnect`);
    });
});

