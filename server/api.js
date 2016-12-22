/**
 * Created by ArH on 2016/12/1.
 */
let db = require('../model/model');


module.exports = function (app) {
    //https://www.baidu.com/p/%E5%90%B4%E5%AD%90%E6%89%AC%E7%BA%AF%E7%BE%8E%E6%96%87/detail
    // 获取用户detail
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
        db.Tieba.find(function (err, docs) {
            res.send(docs);
        })
    });
    //获得贴吧基本信息
    app.post('/tieba', function (req, res) {
        let kw = req.body.kw;
        kw  = kw.toLowerCase();
        if (!kw) {
            res.send({err: 'kw null'});
            return;
        }
        ;
        if (req.params.kw != '') {
            let api = require('./api_action.js');
            api.base_info(kw, function (re) {
                res.send(re);
            })
        } else {
            res.send('{err:"no kw"}');
        }
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
                        "sex":1,
                        "user_age":1,
                        "post_total":1,
                        "vip_level":1,
                        "vip_day":1,
                        "name":1,
                        "portrait":1

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


}

