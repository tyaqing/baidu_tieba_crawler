/**
 * Created by ArH on 2016/12/1.
 */
let db = require('../model/model');


module.exports = function (app) {
    //获取单个贴吧
    app.get('/tieba/:kw', function (req, res) {
        let kw = req.params.kw;
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
        let limit = req.query.limit || 50;
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

    })
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
    })

    //获取用户列表
    app.get('/user', function (req, res) {
        db.User.find()
            .limit(10)
            .exec(function (err, docs) {
                if (err) {
                    res.send({err: 'null'})
                }
                else {
                    res.send(docs);
                }
            })
    })
    //获取单个用户信息
    //TODO
    app.get('/user/:id', function (req, res) {
        let id = req.params.id;
        if (id == null) {
            res.send({err: 'id null'});
        } else {
            db.User.findOne({}, function (err, docs) {

            })
        }
    })


}

