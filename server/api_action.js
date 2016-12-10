/**
 * Created by ArH on 2016/11/30.
 */
let superagent = require('superagent');
let cheerio    = require('cheerio');
let url        = require('url');
let db         = require('../model/model');

let pn     = 0; //贴吧帖子列表数量
let pn_sum = 0; //贴吧列表总数
let kw;
let base_url;

function refresh_url() {
    return `http://tieba.baidu.com/f?kw=${encodeURI(kw)}&pn=${pn}`;
}
//获取贴吧基本信息
exports.base_info = function (_kw, cb) {
    kw       = _kw;
    base_url = refresh_url();
    superagent.get(base_url)
        .end(function (err, res) {
            if (err) {
                return console.error(err)
            }
            let $       = cheerio.load(res.text);
            let num_url = $('.last.pagination-item').attr('href');

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
            }
            pn_sum        = base_info.page_sum;
            db.Tieba.findOneAndUpdate({kw: `${kw}`, _id: `${id}`}, base_info, function (err, docs) {
                if (docs == null) db.Tieba.create(base_info);
            });
            cb(base_info);
        })
};

