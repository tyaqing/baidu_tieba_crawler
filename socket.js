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

server.listen(8081);

app.use(bodyParser.json());
api(app);

let worker;

io.on('connection', function (socket) {
    // 离线事件
    socket.on('disconnect', function () {
        console.log(`${socket.id} disconnect`);
    });

    socket.on('Client_order', function (res) {
        console.log(res);
        switch (res.order) {
            // 获取贴吧列表
            case 'get_tieba_list': {
                console.log(worker);
                if (worker && worker.killed == false) {
                    console.log('有一个子进程正在运行');
                    socket.emit('news', {type: 'msg', data: '有一个子进程正在运行'});
                    return;
                } else {
                    worker = cp.fork('./server/cp.js');

                    worker.send({order: 'get_tieba_list', data: res.data});
                    worker.on("close", function (code, signal) {
                        console.log('close');
                        console.log(code, signal);
                    });

                    worker.on("message", function (data) {
                        // {type: 'msg', data: 'close'}
                        // console.log('message内',data);
                        socket.emit('news', data);
                        if (data.data == 'close') {
                            worker.kill();
                            socket.emit('news', {type: 'msg', data: '爬取结束'});

                        }
                    });

                }
            }
                break;
            // 获取帖子内容
            case 'get_tieba_content': {

                worker = cp.fork('./server/cp.js');
                // console.log(worker);
                // 防止启动多个子进程
                if (worker.killed == false) {
                    socket.emit('news', '爬取已经开始了');
                }
                worker.send({order: 'get_tieba_content', data: res.data});
                worker.on("message", function (data) {
                    // {type: 'msg', data: 'close'}
                    console.log('message内', data);
                    socket.emit('news', data);
                    if (data.data == 'close') {
                        worker.kill();
                        socket.emit('news', {type: 'msg', data: '爬取结束'});

                    }
                });
            }
                break;
            case 'close': {
                console.log('请求停止');
                worker.kill();
            }
                break;
        }
    })
});
