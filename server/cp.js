/**
 * Created by ArH on 2016/11/30.
 */
let superagent = require('superagent');
let cheerio    = require('cheerio');
let url        = require('url');
let db         = require('../model/model');

let pn       = 0; //贴吧帖子列表数量
let pn_sum   = 0; //贴吧列表总数
let kw;
let base_url = `http://tieba.baidu.com/f?kw=${encodeURI(kw)}&pn=${pn}`;


let page        = 1;
let all_content = [];
// 重新组装url
function refresh_url() {
    return `http://tieba.baidu.com/f?kw=${encodeURI(kw)}&pn=${pn}`;
}
// 监听主进程发出的  指令
process.on('message', (m) => {
    //获取贴吧 列表
    if (m.order == 'get_tieba_list') {
        exports.get_list(m.data);
        process.send({type: 'msg', data: '开始爬取'});
    }
    if (m.order == 'get_tieba_content') {
        // 获取该死的fid
        // 因为这个项目开始的时候评论是放在js里面的，做着做着百度通过ajax加载评论了
        // 坑爹
        db.Post.findOne({_id: m.data}, function (err, _res) {
            if (err) return console.log(err);
            let kw = _res.kw;
            db.Tieba.findOne({kw: kw}, function (err, res) {
                if (err) return console.log(err);
                let fid = res._id;
                get_all_content(m.data, fid);
            });
        });

    }
});


// 获得贴吧列表
exports.get_list = function (_kw) {
    db.Tieba.findOne({kw: `${_kw}`}, function (err, doc) {
        //获取贴吧页数
        pn_sum = doc.page_sum;
        process.send({type: 'total', data: pn_sum});
    });
    kw       = _kw;
    base_url = refresh_url();
    get_list(base_url);
};
//爬首页
function get_list(base_url) {
    process.send({type: 'now_num', data: pn});

    superagent.get(base_url)
        .timeout(3000)
        .end(function (err, res) {
            if (err) {
                // 超时重爬      ！！！易出现死循环   各位不要仿效 下次更新解决这个
                //TODO
                get_list(refresh_url());
                return;
            }
            let topicUrls = [];
            let $         = cheerio.load(res.text);
            // 获取首页所有的链接
            $('.j_thread_list .threadlist_lz').each(function (idx, element) {
                var $element = $(element);

                let id_card = $element.find('.tb_icon_author');

                let user_name = $(id_card).find('.j_user_card').text();

                let user_id_json = $(id_card).attr('data-field');
                let user_id      = (JSON.parse(user_id_json)).user_id;
                let href         = url.resolve(base_url, $element.find('a.j_th_tit').attr('href'))
                let title        = $element.find('a.j_th_tit').text();
                let post_id      = ((new RegExp(/\d{7,10}/)).exec(href))[0];
                topicUrls.push({
                    _id      : post_id,
                    href     : href,
                    user_name: user_name,
                    user_id  : user_id,
                    kw       : kw,
                    title    : title
                })
            });
            db.Post.create(topicUrls, function (err, res) {
                // if (err) console.log('有错误或者重复信息');
                if (pn < pn_sum) {
                    pn = pn + 50;
                    get_list(refresh_url());
                } else {
                    console.log('抓取结束');
                    process.send({type: 'msg', data: 'close'});
                }
            })
        })
}
//获取帖子内容  递归
function get_all_content(_post_id, _fid) {

    // 获取所有帖子内容
    // this.post_url = post_url
    let post_url = `http://tieba.baidu.com/p/${_post_id}`;
    superagent
        .get(post_url)
        .query('pn=' + (page++))
        .timeout(3000)
        .end(function (err, res) {
            if (err) {
                return console.log(err);
            }
            let $         = cheerio.load(res.text);
            let post_list = $('#j_p_postlist .j_l_post');

            //判断帖子内容是否为空  为空则为被删帖子
            if (post_list.length == 0) {
                process.send({type: 'msg', data: '帖子为空'});
                return;
            }

            let user_id;

            //获取评论
            superagent
                .get(`http://tieba.baidu.com/p/totalComment?tid=${_post_id}&fid=${_fid}&pn=${page}&see_lz=0`)
                .end(function (err, res) {
                    if (err) return console.log(err);
                    let res_json     = JSON.parse(res.text);
                    let comment_list = res_json.data.comment_list;

                    // 处理评论内容 剔除 a 标签

                    for (let i in comment_list) {
                        let temp = comment_list[i].comment_info;
                        // console.log(temp);
                        for (let _i in temp) {
                            if (temp[_i].content == undefined) continue;
                            temp[_i].content = (temp[_i].content).replace(`href=""  onclick="Stats.sendRequest('fr=tb0_forum&st_mod=pb&st_value=atlink');" onmouseover="showattip(this)" onmouseout="hideattip(this)"`, '');
                        }

                    }


                    // 将评论组装进内容
                    post_list.each(function (i, e) {
                        let json_user  = $(e).attr('data-field');
                        let subContent = [];

                        if (typeof json_user !== 'undefined') {
                            //解析回复内容
                            // 有可能有广告 需要过滤广告
                            let content = $(e).find('.j_d_post_content').text().trim();
                            if (content == '') return;

                            let revert_item = JSON.parse(json_user);

                            let user_name = $(e).find('.p_author_name.j_user_card').text();
                            let level     = $(e).find('.d_badge_lv').text();
                            //重新组装
                            let img_dom   = $(e).find('.j_d_post_content').find('img');
                            let img_arr   = [];
                            $(img_dom).each(function (i, e) {
                                img_arr.push($(e).attr('src'))
                            });

                            let sub = {
                                'post_no'    : revert_item.content.post_no,
                                'post_id'    : revert_item.content.post_id,
                                'user_id'    : revert_item.author.user_id,
                                'user_name'  : user_name,
                                'level'      : level,
                                'img'        : img_arr,
                                'comment'    : comment_list[revert_item.content.post_id],
                                'comment_num': revert_item.content.comment_num,
                                'content'    : content,
                                'open_type'  : revert_item.content.open_type, //手机类型
                                'date'       : revert_item.content.date,
                            };
                            all_content.push(sub);
                        }
                    });

                    console.log('共' + post_list.length + '条记录');
                    if (post_list.length >= 30) {
                        get_all_content(_post_id, _fid)
                    } else {
                        //在这里告诉函数可以执行了
                        let title    = $('.core_title_txt').text().trim();
                        let mattchId = new RegExp(/\d{10}/);
                        let res      = {
                            id      : ID = mattchId.exec(post_url)[0],
                            _id     : ID,
                            user_id : user_id,
                            title   : title,
                            href    : post_url,
                            postlist: all_content,
                        };

                        // console.log(res);
                        //保存更新帖子
                        db.Post.findOneAndUpdate({_id: res._id}, {$set: {postlist: res.postlist}}, function (err, docs) {
                            // console.log(err,docs);
                            if (err) return console.log(err);
                            process.send({type: 'success', data: '爬取成功'});
                        })

                    }
                });
        })
}


