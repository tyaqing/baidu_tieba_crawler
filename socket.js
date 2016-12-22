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
let port = 8081;


server.listen(port);
app.use(bodyParser.json());
api(app);

// 统计子进程 用于限制子进程个数 避免宕机 worker_max 最大进程数
// TODO  需要在进程生成的时候完成累加，进程结束时累减
let worker_sum = 0,
     worker_max = 50,
    connectCounter=0;
let worker_status = function(){
    io.sockets.emit("worker_sum",{worker_sum,connectCounter});
};

io.on('connection', function (socket) {
    connectCounter++;
    console.log(connectCounter);

    // TODO 发送当前系统正在执行子进程的个数
    worker_status();
    // 离线事件  离线就kill掉进程
    socket.on('disconnect', function () {
        connectCounter--;

        // 浏览器失联 关掉正在运行的子进程
        console.log(`${socket.id} disconnect`);
        if (socket.worker && socket.worker.killed == false) {
            socket.worker.kill();
            worker_sum--;
        }
        worker_status();

    });

    // 统一管理监听发信
    let worker_on = function () {
        // worker 事件 error exit close
        socket.worker.on("message", function (data) {
            // {type: 'msg', data: 'close'}
            console.log('cp message : ', data);

            if(data.type=='msg'){
                socket.emit('info', data.data);
            }else if (data.type == "now_num") {
                socket.emit('now_num', data.data);
            }else if (data.type == "total") {
                socket.emit('total', data.data);
            }else if (data.type == 'close') {
                socket.worker.kill();
                worker_sum--;
                worker_status();
                socket.emit('success', '爬取结束');
            }else if(data.type=='get_content'){
                socket.emit('get_content','success');
            }else if(data.type=='user_process'){
                socket.emit('user_process', data.data);
            }
        });
        socket.worker.on("close", function (code, signal) {
            console.log('close');
            console.log(code, signal);
        });
    };
    // 获取贴吧列表
    socket.on('get_tieba_list', function (res) {
        if (socket.worker && socket.worker.killed == false) {
            socket.emit('warning', '该页面有一个子进程正在运行,请开启另一个网页进行爬取');
            return;
        }
        // 将子进程放入socket对象 到达一网页一子进程的效果 实现多网页多子进程爬取
        socket.worker = cp.fork('./server/cp.js');
        // 开启监听
        worker_on();
        worker_sum++;
        worker_status();
        socket.worker.send({order: 'get_tieba_list', data: res});

    });
    //获取帖子内容
    socket.on('get_tieba_content', function (res) {
        if (socket.worker && socket.worker.killed == false) {
            socket.emit('warning', '该页面有一个子进程正在运行,请开启另一个网页进行爬取');
            return;
        }
        socket.worker = cp.fork('./server/cp.js');
        worker_on();
        worker_sum++;
        worker_status();
        socket.worker.send({order: 'get_tieba_content', data: res});
    });
    // 爬取贴吧会员列表
    socket.on('get_member_list', function (res) {
        if (socket.worker && socket.worker.killed == false) {
            socket.emit('warning', '该页面有一个子进程正在运行,请开启另一个网页进行爬取');
            return;
        }
        // 将子进程放入socket对象 到达一网页一子进程的效果 实现多网页多子进程爬取
        socket.worker = cp.fork('./server/cp.js');
        // 开启监听
        worker_on();
        worker_sum++;
        worker_status();
        socket.worker.send({order: 'get_member_list', data: res});

    });

    //请求停止
    socket.on('close', function (res) {
        console.log('请求停止');
        if (socket.worker && socket.worker.killed == false) {
            socket.worker.kill();
            worker_sum--;
            worker_status();
            if(res!='back_close'){
                socket.emit('info', '已停止当前页面的爬取任务');
            }else{
                socket.emit('info', '离开页面后会中断爬取');
            }
        }
        else {
            if(res!='back_close') socket.emit('warning', '没有可停止的对象');
        }
    });


});

