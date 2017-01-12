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
             if (err) return console.log(err);
             console.log(job.id + ' compelet');
             done();
         })
     });
});
// 爬帖子列表结束通知
queue.process('get_tieba_list_unlock', function(job, done){
    console.log(job.data);
    db.Tieba.findOne({_id:job.data._id},function(err,doc){
        console.log('get_tieba_list_unlock');
        //解锁
        doc.update({$set:{crawler_lock:false,out_queue_time:Date.now()}},function(err,doc){
            done();
        });
    });
});