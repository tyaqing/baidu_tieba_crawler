/**
 * Created by ArH on 2016/12/23.
 */

let superagent = require('superagent');
let charset    = require('superagent-charset');
let cheerio    = require('cheerio');
let url        = require('url');
charset(superagent);

//
// superagent.get('http://tieba.baidu.com/bawu2/platform/listMemberInfo?word=seo')
//     .charset('gbk')
//     .timeout(3000)
//     .end(function (err, res) {
//         if (err) {
//             // 超时重爬      ！！！易出现死循环   各位不要仿效 下次更新解决这个
//             //TODO
//             console.log('超时');
//             return;
//         }
//         let rule = {
//             member_counter: {selector: '.card_menNum', filter: "replace(/,/g,'')", text: 1},
//             post_counter  : {selector: '.card_infoNum', filter: "replace(/,/g,'')", text: 1},
//             directory     : {selector: '.forum_dir_info li a', text: 1},
//             page          : {selector: '.card_title_fname', text: 1,filter:'trim()'},
//             page_total    : {selector: '.tbui_total_page', text: 1, filter: "replace(/共(\\d*)页/,'$1')"},
//             member_list   : {
//                 selector: '.forum_info_section .member',
//                 child   : [
//                     {username: {selector: '.user_name', text: 1}},
//                     {
//                         level: {
//                             selector: '.forum-level-bawu',
//                             filter  : "replace('forum-level-bawu bawu-info-lv','')",
//                             attr    : 'class'
//                         }
//                     },
//                     {portrait: {selector: 'img', attr: 'src'}},
//                 ],
//             }
//         };
//
//
//         let argon = new Argon(res.text, rule);
//         argon.test();
//         argon.getDate(rule);
//     });
function Argon(html, rule, cb) {
    // console.log(html);
    this.$                      = cheerio.load(html);
    this.obj                    = {};
    this.process_selector       = function (v) {
        if (v.text)  return this.$(v.selector).text();
        else if (v.attr) return this.$(v.selector).attr(v.attr);
        else if (v.html) return this.$(v.selector).html();
    };
    this.process_child_selector = function (e, v) {
        if (v.text)  return this.$(e).find(v.selector).text();
        else if (v.attr) return this.$(e).find(v.selector).attr(v.attr);
        else if (v.html) return this.$(e).find(v.selector).html();
    };
    this.process_child          = function (rule) {
        let ret        = [];
        let _this      = this;
        let child_rule = rule.child;
        this.$(rule.selector).each(function (i, e) {
            let item = {};
            for (let i = 0; i < child_rule.length; i++) {
                for (let child_k in child_rule[i]) {
                    item[child_k] = _this.process_child_selector(e, child_rule[i][child_k]);
                    // console.log(child_rule[i][child_k].filter);
                    if (child_rule[i][child_k].filter) {
                        try {
                            eval(`item[child_k] =  item[child_k].${child_rule[i][child_k].filter}`);
                        }
                        catch (err) {
                            console.log('这个过滤器似乎有问题', child_rule[i][child_k].filter);
                        }
                    }
                }
            }
            ret.push(item);
        });
        return ret;
    };
}
Argon.prototype.test   = function () {
    console.log(this.obj);
};
Argon.prototype.getDate = function (rule) {
    for (let k in rule) {
        if (typeof rule != 'object') return console.error('书写规则出错');
        // 处理 selector 处理 attr text html
        // 如果爬列表
        if (rule[k].child) {
            this.obj[k] = this.process_child(rule[k]);
        } else {
            this.obj[k] = this.process_selector(rule[k]);
            // console.log(rule[k].filter);
            if (rule[k].filter) {
                try {
                    if(rule[k].filter) eval(`this.obj[k] =  this.obj[k].${rule[k].filter}`);
                }
                catch (err) {
                    console.log('这个过滤器似乎有问题', rule[k].filter);
                }
            }
        }
    }
};
exports.Argon = Argon;
