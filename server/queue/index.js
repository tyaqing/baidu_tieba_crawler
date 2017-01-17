/**
 * Created by ArH on 2017/1/11.
 */
let kue = require('kue')
    , queue = kue.createQueue();
let db = require('../../model/model'),
    func = require('../func');


// 监听主进程发出的  指令
process.on('message', (m) => {
   console.log(m);
});

// 爬帖子列表
queue.process('get_tieba_list', function(job, done){
     func.get_tieba_list(job.data,function(data){
         db.Post.create(data, function (err, res) {
             if (err) return done();
             console.log(job.id + ' compelet');
             done();
         })
     });
});

// 爬帖子列表结束通知  或者socket通知
queue.process('get_tieba_list_complete', function(job, done){
    console.log(job.data);
    console.log('get_tieba_list_complete');
    done();
});

// 爬用户列表 utf-8
queue.process('get_member_list', function(job, done){
    // console.log(job.data);
    let tieba = job.data.tieba;
    func.get_member_list(job.data,function(member_list){
        //获得member_list 然后将memberlist 逐条加入任务队列
        // console.log(member_list);
        for(let i =0;i<member_list.length;i++){
            queue.create('get_member_info', {
                url: `http://tieba.baidu.com/home/main?un=${encodeURI(member_list[i].name)}`,
                kw : tieba.kw,
                level:member_list[i].level,
                _id: tieba._id,
                name:member_list[i].name,
                tieba:tieba
            }).save(function (err) {
                if (err) res.send({err: err});
            });
        }
        done();
    });
});

// 爬用户列表
queue.process('get_member_list_complete', function(job, done){
    console.log('正在爬取 ' +job.data);
    console.log('get_member_list_complete');
    done();
});

// 爬用户详情
queue.process('get_member_info',function(job,done){
     func.get_member_info(job.data,function(user_info){
         // console.log(user_info);
         if(user_info==null) return done();
         console.log(`已获得 ${user_info.name} 的信息`);
         db.User.create(user_info, function (err, res) {
             done();
         });

     })
});