/**
 * Created by ArH on 2016/12/1.
 */
let db      = require('../model/model');
let kue     = require('kue')
    , queue = kue.createQueue();
let cp      = require('child_process');
let func    = require('./func');

let worker_list = [];

kue.app.listen(3000);

module.exports = function (app) {

    //获取单个贴吧
    app.get('/tieba/:kw', function (req, res) {
        let kw = req.params.kw;
        if (!kw) res.send({err: 'kw null'});
        db.Tieba.findOne({kw: `${kw}`}, function (err, docs) {
            if (!docs) {
                res.send({err: null})
            }
            else {
                res.send(docs);
            }
            console.log(docs)
        })
    });

    //获取贴吧列表
    app.get('/tieba', function (req, res) {
        db.Tieba.find({})
            .exec(function (err, docs) {
                docs.reverse();
                res.send(docs);
            });
    });

    //获取帖子列表
    app.get('/p', function (req, res) {
        let limit = req.query.limit || 24;
        let skip  = req.query.skip || 0;
        let kw    = decodeURI(req.query.kw) || '湖南工学院';

        let count;
        console.log(kw);
        db.Post.count({kw: kw}, function (err, _count) {
            count = _count;
            db.Post.find({kw: kw})
                .sort({last_update: 'asc'})
                .skip(parseInt(skip))
                .limit(parseInt(limit))
                .exec(function (err, docs) {
                    res.send({data: docs, count: count});
                })
        })

    });
    //获取单个帖子内容
    //TODO
    app.get('/p/:id', function (req, res) {
        let id = req.params.id;
        if (id == null) {
            res.send({err: 'id null'});
        } else {
            db.Post.findOne({_id: id}, function (err, doc) {
                res.send(doc);
            })

        }
    });
    //获取贴吧下用户列表
    /*
     获取贴吧吧主
     {'tieba_list':{"$elemMatch":{'kw':"麻阳二中",'bazhu':"吧主"}}}
     */
    app.get('/user', function (req, res) {
        let limit = req.query.limit || 24;
        let skip  = req.query.skip || 0;
        let kw    = decodeURI(req.query.kw) || '湖南工学院';
        if (!kw) res.send({err: 'kw is null'});
        let count;
        db.User.count({'tieba_list.kw': kw}, function (err, _count) {
            count = _count;
            db.User.find({'tieba_list.kw': kw},
                {
                    "tieba_list": {$elemMatch: {kw: kw}},
                    "sex"       : 1,
                    "user_age"  : 1,
                    "post_total": 1,
                    "vip_level" : 1,
                    "vip_day"   : 1,
                    "name"      : 1,
                    "portrait"  : 1

                })
                .sort({last_update: 'asc'})
                .skip(parseInt(skip))
                .limit(parseInt(limit))
                .exec(function (err, docs) {
                    res.send({data: docs, count: count});
                })
        });


    });

    //获取单个用户信息 name
    app.get('/user/name/:name', function (req, res) {
        let name = req.params.name;
        if (name == null) {
            res.send({err: 'name null'});
        } else {
            db.User.findOne({'name': name}, function (err, docs) {
                res.send(docs);
            })
        }
    });

    //获取单个用户信息 id
    app.get('/user/id/:id', function (req, res) {
        let id = req.params.id;
        if (id == null) {
            res.send({err: 'id null'});
        } else {
            db.User.findOne({'id': id}, function (err, docs) {
                res.send(docs);
            })
        }
    });

    //获取单个帖子所有内容
    app.get('/get_tieba_content', function (req, res) {
        let pid = req.query.pid;
        db.Post.findOne({_id: pid}, function (err, post) {
            if (err) return console.log(err);
            let kw = post.kw;
            db.Tieba.findOne({kw: kw}, function (err, tieba) {
                if (err) return console.log(err);
                let fid = tieba._id;
                func.get_all_content({pid: pid, fid: fid}, (data) => {
                    //保存更新帖子
                    post.update({$set: {postlist: data.postlist}}, function (err, doc, d) {
                        if (err) return console.log(err);
                        res.send({success: '抓取成功'});
                    });

                });
            });
        });
    });

    //获得贴吧基本信息
    app.post('/tieba', function (req, res) {
        let kw = req.body.kw;
        // 贴吧存的就是小写的
        kw     = kw.toLowerCase();
        if (!kw) {
            res.send({err: 'kw null'});
            return;
        }
        if (req.params.kw != '') {
            func.base_info(kw, function (data) {
                if (data == null) return res.send({error: '找不到该贴吧'});
                db.Tieba.findOneAndUpdate({kw: `${kw}`}, data, function (err, docs) {
                    if (docs == null) db.Tieba.create(data);
                });
                res.send(data);
            });
        } else {
            res.send('{err:"no kw"}');
        }
    });


    // queue 接口

    // 获取贴吧列表
    app.get('/queue/get_tieba_list', function (req, res) {
        let kw = req.query.kw;
        if (!req.query.kw) res.send({err: 'kw null'});
        /*
         首先 查找队列 是否有正在爬取
         删除 数组中对象
         */
        kue.Job.rangeByType('get_tieba_list_complete', 'inactive', 0, -1, 'asc', function (err, jobs) {
            for (let i = 0; i < jobs.length; i++) {
                if (jobs[i].data.kw == kw)  return res.send({warning: '这个贴吧会员正在爬取队列中'});
            }
            // 找不到就创建一个队列记录
            db.Tieba.findOne({kw: kw}, function (err, doc) {
                //循环队列
                let page_sum = doc.page_sum == 0 ? 0 : doc.page_sum / 50;
                for (let i = 0; i <= page_sum; i++) {
                    queue.create('get_tieba_list', {
                        url: `http://tieba.baidu.com/f?kw=${encodeURI(kw)}&pn=${i * 50}`,
                        kw : kw,
                        _id: doc._id
                    }).save(function (err) {
                        if (err) res.send({err: err});
                    });
                }

                // 完成后会执行解锁队列
                queue.create('get_tieba_list_complete', {
                    kw : kw,
                    _id: doc._id
                }).save(function (err, info) {
                    if (err) res.send({err: err});
                });
                res.send({success: '创建队列成功'});
            });
        });
    });

    // 获取用户列表
    app.get('/queue/get_member_list', function (req, res) {
        let kw = req.query.kw;
        if (!req.query.kw) res.send({err: 'kw null'});

        kue.Job.rangeByType('get_member_list_complete', 'inactive', 0, -1, 'asc', function (err, jobs) {
            for (let i = 0; i < jobs.length; i++) {
                if (jobs[i].data.kw == kw)  return res.send({warning: '这个贴吧会员正在爬取队列中'});
            }
            // 找不到就创建一个队列记录
            db.Tieba.findOne({kw: kw}, function (err, doc) {
                //循环队列
                func.gbk_encode(kw, function (gbk_kw) {
                    // 循环入队
                    let page_sum = doc.follow_sum < 24 ? 1 : (doc.follow_sum / 24) + 1;
                    for (let i = 1; i <= page_sum; i++) {
                        queue.create('get_member_list', {
                            url  : `http://tieba.baidu.com/bawu2/platform/listMemberInfo?word=${gbk_kw}&pn=${i}`,
                            kw   : kw,
                            _id  : doc._id,
                            tieba: doc
                        }).save(function (err) {
                            if (err) res.send({err: err});
                        });
                    }
                    // 完成后会执行解锁队列
                    queue.create('get_member_list_complete', {
                        kw : kw,
                        _id: doc._id
                    }).save(function (err, info) {
                        if (err) res.send({err: err});
                    });
                    res.send({success: '创建队列成功'});
                });

            });
        });
    });


    // app.get('/queue/test',provides('content'));
    app.get('/queue/status', function (req, res) {
        db.Tieba.find({crawler_lock: true}, function (err, tiebas) {
            res.send(tiebas);
        });
    });


    //queue 学习promise

    app.get('/queue/clean', function (req, res) {
        kue.Job.rangeByState('inactive', 0, -1, 'asc', function (err, jobs) {
            jobs.forEach(function (job) {
                job.remove(function () {
                    console.log('removed ', job.id);
                    kue.Job.rangeByState('active', 0, -1, 'asc', function (err, jobs) {
                        jobs.forEach(function (job) {
                            job.remove(function () {
                                console.log('removed ', job.id);
                                res.send({success: '已清除所有队列'});
                            });
                        });

                    });
                });
            });
        });
    });


    /*
     处理进程
     */
    //运行处理队列子进程
    app.get('/queue/manage', function (req, res) {
        if (req.query.type == 'start_queue') {
            let worker = cp.fork('./server/queue/index.js');
            worker_list.push(worker);
            return res.send({success: '创建进程成功'});
        }
        return res.send({error: 'value null'});
    });
    // 进程状态
    app.get('/cp/stats',function(req,res){
        console.log()

    });


};

console.log(typeof queue);
queue.on('job enqueue', function (id, type) {
    console.log('Job %s got queued of type %s', id, type);
});

// queue.inactive( function( err, ids ) { // others are active, complete, failed, delayed
//     console.log(ids);
// });

// queue.active( function( err, ids ) {
//     ids.forEach( function( id ) {
//         kue.Job.get( id, function( err, job ) {
//             // Your application should check if job is a stuck one
//             job.inactive();
//         });
//     });
// });

// queue.inactiveCount( function( err, total ) { // others are activeCount, completeCount, failedCount, delayedCount
//    console.log(total);
// });
// queue.completeCount( function( err, total ) { // others are activeCount, completeCount, failedCount, delayedCount
//     console.log(total);
// });

kue.Job.rangeByType('get_tieba_list', 'active', 0, -1, 'asc', function (err, jobs) {
    // console.log(jobs);
});

kue.Job.rangeByState('active', 0, -1, 'asc', function (err, jobs) {
    // you have an array of maximum n Job objects here
    console.log(jobs.length);
});

