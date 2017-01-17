/**
 * Created by ArH on 2017/1/11.
 */
let superagent = require('superagent');
let charset    = require('superagent-charset');
let cheerio    = require('cheerio');
let url        = require('url');
charset(superagent);
let page        = 0;
let all_content = [];
/**
 * 获取贴吧吧列表
 * @param job {url,kw}
 * @param cb
 */
exports.get_tieba_list = function (job, cb) {
    let target_url = job.url, kw = job.kw;
    superagent.get(target_url)
        .timeout(3000)
        .end(function (err, res) {
            if (err) {
                console.log('爬取失败重试');
                exports.get_tieba_list(target_url);
                return;
            }
            let topicUrls = [];
            let $         = cheerio.load(res.text);
            // 获取首页所有的链接
            $('.j_thread_list .threadlist_lz').each(function (idx, element) {
                let $element = $(element);

                let id_card = $element.find('.tb_icon_author');

                let user_name = $(id_card).find('.j_user_card').text();

                let user_id_json = $(id_card).attr('data-field');
                let user_id      = (JSON.parse(user_id_json)).user_id;
                let href         = url.resolve(target_url, $element.find('a.j_th_tit').attr('href'));
                let title        = $element.find('a.j_th_tit').text();
                let post_id      = ((new RegExp(/\d{4,10}/)).exec(href))[0];
                topicUrls.push({
                    _id      : post_id,
                    href     : href,
                    user_name: user_name,
                    user_id  : user_id,
                    kw       : kw,
                    title    : title
                });
            });
            cb(topicUrls);
        });
};
/**
 *  获取帖子所有内容
 * @param job {pid,fid}
 * @param cb
 */
exports.get_all_content = function (job, cb) {
    let pid = job.pid, fid = job.fid;
    // 获取所有帖子内容
    // this.post_url = post_url
    let post_url = `http://tieba.baidu.com/p/${pid}`;
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
                console.log('数据为空 可能被删除');
                return;
            }
            let user_id;
            //获取评论
            superagent
                .get(`http://tieba.baidu.com/p/totalComment?tid=${pid}&fid=${fid}&pn=${page}&see_lz=0`)
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
                        exports.get_all_content(pid, fid)
                    } else {
                        //在这里告诉函数可以执行了
                        let title    = $('.core_title_txt').text().trim();
                        let mattchId = new RegExp(/\d{10}/);
                        let id       = mattchId.exec(post_url)[0];
                        let res      = {
                            id      : id,
                            _id     : id,
                            user_id : user_id,
                            title   : title,
                            href    : post_url,
                            postlist: all_content,
                        };
                        cb(res);
                    }
                });
        })
};
/**
 * 获取贴吧基本信息
 * @param _kw
 * @param cb
 */
exports.base_info = function (_kw, cb) {
    let kw       = _kw;
    let base_url = `http://tieba.baidu.com/f?kw=${encodeURI(kw)}`;
    superagent.get(base_url)
        .end(function (err, res) {
            if (err) {
                return console.error(err)
            }

            let $       = cheerio.load(res.text);
            let num_url = $('.last.pagination-item').attr('href');

            if (!num_url) return cb(null);

            let all_num = $('.th_footer_l .red_text');


            let id = (/forum_id":(\d+)/.exec(res.text))[1];

            let base_info = {
                _id       : id,
                kw        : kw,
                page_sum  : num_url ? parseInt((/=(\d+)/g.exec(num_url))[1]) : 0,
                follow_sum: $(all_num[2]).text(),
                topic_sum : $(all_num[0]).text(),
                post_sum  : $(all_num[1]).text(),
                head_img  : $('#forum-card-head').attr('src') || 'http://tb1.bdstatic.com/tb/cms/ngmis/file_1473324438430.PNG'
            };
            cb(base_info);
        })
};
/**
 * 获取贴吧用户列表
 * @param job
 * @param cb
 */
exports.get_member_list = function (job, cb) {
    let _url = job.url, tieba = job.tieba;
    superagent.get(_url)
        .charset('gbk')
        .timeout(3000)
        .end(function (err, res) {
            if (err) {
                console.log('超时重爬');
                exports.get_member_list(_url);
                return;
            }
            let member_name_list = [],
                $                = cheerio.load(res.text),
                $member_list     = $('.forum_info_section .member');

            if ($member_list.length == 0) {
                //证明没了
                return console.log('抓取结束');
            }

            $member_list.each(function (i, e) {
                let member = {
                    name : $(e).find('.user_name').attr('title'),
                    kw   : tieba.kw,
                    level: ($(e).find('.forum-level-bawu').attr('class')).replace('forum-level-bawu bawu-info-lv', ''),
                    fid  : tieba._id,
                };
                member_name_list.unshift(member);
            });
            cb(member_name_list);
        })
};
/**
 * 获得用户详细信息
 * @param member
 * @param cb
 */
exports.get_member_info = function (member, cb) {
    let _url = member.url;
    console.log(_url);
    superagent.get(_url)
        .timeout(3000)
        .end(function (err, res) {
            if (err) {
                console.log('超时重爬');
                exports.get_member_info(member, cb);
                return;
            }

            let $ = cheerio.load(res.text);

            let $user_info = $('.userinfo_userdata span');
            //判断是不是贴吧会员   以及用户可能已被注销 还有用户资料被影藏
            let sex, user_age, post_total, user_info, vip_day, vip_level, user_id;

            if ($user_info.length == 0) {
                //用户被删除 或影藏了信息
                console.log('用户被删除或者');
                cb(null);
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

            console.log('关注贴吧数量 ' + $tieba_list.length);
            // 如果是0，说明用户隐藏了个人动态 但至少能确认在 正在爬的贴吧里
            let current_tieba = {
                fid:member._id,
                kw:member.kw,
                level:member.level,
                bazhu:''
            }
            if ($tieba_list.length != 0) {
                $tieba_list.each(function (i, e) {
                    let tieba = {
                        fid  : $(e).attr('data-fid'),
                        kw   : $($(e).find('span')[0]).text(),
                        level: ($($(e).find('.forum_level')).attr('class')).replace('forum_level lv', ''),
                        bazhu: $($(e).find('.honor')).text()
                    };
                    tieba_list.unshift(tieba);
                });
            } else {
                tieba_list.push(current_tieba);
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
};


// 这里希望有大神能帮我下，关于js 怎么 gbk编码encode
exports.gbk_encode = function (str, cb) {
    /*    php源码
     header('Content-Type: application/json');
     echo json_encode(array('str'=>urlencode(iconv('UTF-8', 'GB2312', $_GET['str']))));
     */
    let url = `http://gbk.femirror.com?str=${encodeURI(str)}`;
    console.log(url);
    superagent.get(url)
        .end(function (err, res) {
            console.log(res.body.str);
            cb(res.body.str);
        });
};