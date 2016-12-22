/**
 * Created by ArH on 2016/11/30.
 */

//mmd 百度贴吧会员网站的编码又是gbk编码的
var iconv = require('iconv');
let superagent = require('superagent');
let charset    = require('superagent-charset');
let cheerio    = require('cheerio');
let url        = require('url');
let db         = require('../model/model');

let pn              = 0; //贴吧帖子列表数量
let pn_sum          = 0; //贴吧列表总数
let kw;
let base_url        = `http://tieba.baidu.com/f?kw=${encodeURI(kw)}&pn=${pn}`;
let member_list_url = `http://tieba.baidu.com/bawu2/platform/listMemberInfo?word=${encodeURI(kw)}&pn=${pn}`;


// this will add request.Request.prototype.charset
charset(superagent);
let g_fid;
let page        = 1;
let page_sum        = 0;
let all_content = [];
// 重新组装url
function member_list_url_refresh(cb) {
    gbk_encode(kw,function(res){
        cb(`http://tieba.baidu.com/bawu2/platform/listMemberInfo?word=${res}&pn=${page}`);
    });
}
function refresh_url() {
    return `http://tieba.baidu.com/f?kw=${encodeURI(kw)}&pn=${pn}`;
}
function generate_member_info_url(name) {
    return `http://tieba.baidu.com/home/main?un=${encodeURI(name)}`;
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
                process.send({type: 'msg', data: '正在获取帖子内容'});
                get_all_content(m.data, fid);
            });
        });

    }
    if (m.order == 'get_member_list') {
        process.send({type: 'msg', data: '开始爬取用户'});

        kw              = m.data;
        db.Tieba.findOne({kw: kw}, function (err, res) {
            if (err) return console.log(err);
            g_fid = res._id;
            member_list_url_refresh(function(member_list_url){
                get_member_list(member_list_url);
            });
        });


        // process.send({type: 'msg', data: '开始爬取'});
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
    // console.log(base_url);
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
                    process.send({type: 'close', data: 'close'});
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
                            process.send({type: 'get_content', data: '爬取成功'});
                            process.send({type: 'close', data: 'close'});
                        })

                    }
                });
        })
}
// 获取用户列表
function get_member_list(member_list_url) {
    console.log(member_list_url);
    superagent.get(member_list_url)
        .charset('gbk')
        .timeout(3000)
        .end(function (err, res) {
            if (err) {
                // 超时重爬      ！！！易出现死循环   各位不要仿效 下次更新解决这个
                //TODO
                console.log('超时重爬');
                get_member_list(member_list_url);
                return;
            }
            let member_name_list  = [],
                $            = cheerio.load(res.text),
                $member_list = $('.forum_info_section .member');
            page_sum           = ($('.tbui_total_page').text()).replace(/共(\d*)页/, "$1");


            if($member_list.length==0){
                //证明没了
                console.log('抓取结束');
                process.send({type: 'close', data: 'close'});
            }

            $member_list.each(function (i, e) {
                let member ={
                    name : $(e).find('.user_name').attr('title'),
                    kw : kw,
                    level:($(e).find('.forum-level-bawu').attr('class')).replace('forum-level-bawu bawu-info-lv',''),
                    fid: g_fid,
                };

                member_name_list.unshift(member);
            });
            get_member_info_loop(member_name_list, function (member_list) {
                // console.log(member_list);
                db.User.create(member_list, function (err, res) {
                    if (err) console.log(err);
                    if(res) console.log('mongo 存储成功');
                    //重置
                    idx           = 0;
                    member_list   = [];
                    if (page <= page_sum) {
                        page++;
                        member_list_url_refresh(function(member_list_url){
                            get_member_list(member_list_url);
                        });
                    } else {
                        console.log('抓取结束');
                        process.send({type: 'close', data: 'close'});
                    }
                })
            });
        })
}

let idx           = 0,
    member_list   = [];
// 设计成同步回调
function get_member_info_loop(member_name_list, cb) {
    let member_length = member_name_list.length;
    //TODO 先检测数据库是否已存在该用户 减少http请求
    get_member_info(member_name_list[idx], function (user_info) {
        if(user_info){
            member_list.push(user_info);
        }
        idx++;
        if (idx < member_length) {
            get_member_info_loop(member_name_list, cb);
        } else {
            cb(member_list);
        }
    });
}

// 获得单个用户基本信息
function get_member_info(member, cb) {
    let url = generate_member_info_url(member.name);
    process.send({type: 'user_process', data: member});
    console.log(url);
    superagent.get(url)
        .timeout(3000)
        .end(function (err, res) {
            if (err) {
                // 超时重爬      ！！！易出现死循环   各位不要仿效 下次更新解决这个
                //TODO
                console.log('超时重爬');
                get_member_info(member.name,cb);
                return;
            }

            let $ = cheerio.load(res.text);

            let $user_info = $('.userinfo_userdata span');
            //判断是不是贴吧会员   以及用户可能已被注销 还有用户资料被影藏
            let sex, user_age, post_total, user_info, vip_day, vip_level, user_id;

            if ($user_info.length == 0) {
                //用户被删除 或影藏了信息
                console.log('用户被删除或者');
                cb(false);
                return;
            }
            if ($user_info.length >= 4) {
                // 普通用户
                sex                = ($($user_info[0]).attr('class')).replace('userinfo_sex userinfo_sex_', '');
                user_age           = ($($user_info[1]).text()).replace(/吧龄:(\d*\.*\d*)年*/, "$1");
                let pre_post_total = ($($user_info[3]).text());
                if (pre_post_total.indexOf('万') != -1) {
                    post_total = pre_post_total.replace(/发贴:(\d*\.\d*)万/, "$1");
                    post_total = post_total * 10000;
                } else {
                    post_total = pre_post_total.replace(/发贴:(\d*)/, "$1");
                }
                vip_day   = false;
                vip_level = false;
            }
            if ($user_info.length >= 6) {
                // 用户是会员
                vip_day   = ($($user_info[5]).text()).replace(/会员天数:(\d*)/, "$1");
                vip_level = ($('.userinfo_title .pre_icon_wrap a').attr('class')).replace('icon_tbworld icon-crown-super-v', '');
            }

            // 获取用户头像
            let portrait = $('.userinfo_head img').attr('src');


            // 获取用户user_id   用第22个script标签这种方法不是很稳定
            let temp = $($('script')[22]).text();
            /*   得到这样的json
             PageData.forum = PageData.forum || {};
             PageData.forum.id = 0;
             PageData.forum.name = '';
             PageData.current_page_uname = '促赘狡值堤始';
             _.Module.use('ihome/widget/Userinfo',
             {
             "user":{
             "user_id":2324850226,
             "homeUserName":"\u4fc3\u8d58\u72e1\u503c\u5824\u59cb",
             "personal_pronouns":"\u4ed6",
             "appraise":null,
             "medal_endtime":""
             },
             "isSuperMember":false,
             "isAnnualMember":false,
             "memberLevel":1
             });

             */
            user_id = (/{"user_id":(\d*)/.exec(temp))[1];

            // 获取关注的贴吧列表
            let $tieba_list = $('#forum_group_wrap a'),
                tieba_list  = [];

            console.log('关注贴吧数量 '+$tieba_list.length);
            // 如果是0，说明用户隐藏了个人动态 但至少能确认在 正在爬的贴吧里
            if($tieba_list.length!=0){
                $tieba_list.each(function (i, e) {
                    let tieba = {
                        fid  : $(e).attr('data-fid'),
                        kw   : $($(e).find('span')[0]).text(),
                        level: ($($(e).find('.forum_level')).attr('class')).replace('forum_level lv', ''),
                        bazhu: $($(e).find('.honor')).text()
                    };
                    tieba_list.unshift(tieba);
                });
            }else{
                tieba_list.push(member);
            }



            user_info = {
                _id       : user_id,
                sex       : sex,
                name      : member.name,
                user_age  : user_age,
                post_total: post_total,
                vip_day   : vip_day,
                vip_level : vip_level,
                portrait  : portrait,
                tieba_list: tieba_list,
            };
            cb(user_info);
        });
}


// 这里希望有大神能帮我下，关于js 怎么 gbk编码encode
function gbk_encode(str,cb){
    /*    php源码
     header('Content-Type: application/json');
     echo json_encode(array('str'=>urlencode(iconv('UTF-8', 'GB2312', $_GET['str']))));
    */
    let url = `http://gbk.femirror.com?str=${encodeURI(str)}`;
    console.log(url);
    superagent.get(url)
        .end(function(err,res){
            console.log(res.body.str);
            cb(res.body.str);
        });
}

