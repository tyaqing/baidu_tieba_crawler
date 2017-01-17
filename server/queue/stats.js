/**
 * Created by ArH on 2017/1/16.
 */

// 用于数据统计

let kue     = require('kue')
    , queue = kue.createQueue();

module.exports = function(cb){
    // 获得基本信息
    get(queue)
    ('inactiveCount')
    ('completeCount')
    ('activeCount')
    ('failedCount')
    ('delayedCount')
    ('workTime')
    (function( err, obj ) {
        kue.Job.rangeByType('get_tieba_list_complete', 'inactive', 0, -1, 'desc', function (err, jobs) {
            let resp = [];
            for(let i =0;i<jobs.length;i++){
                resp.unshift({
                    kw:jobs[i].data.kw,
                });
            }

            obj.queue = resp;
            obj.cp = {
                sum:worker.cp_list.length,
                limit:worker.limit
            };
            // console.log(jobs);
            global.global_stats = obj;
        });

    });
//     queue.inactiveCount( function( err, total ) { // others are activeCount, completeCount, failedCount, delayedCount
//    console.log(total);
// });
// queue.completeCount( function( err, total ) { // others are activeCount, completeCount, failedCount, delayedCount
//     console.log(total);
// });

};
// function get(obj){
//     let res = {};
//     return function _(str){
//         // console.log(str);
//         if(typeof str =='string'){
//             obj[str](function(err,total){
//                 res[str]=total;
//             });
//         }else if(typeof str == 'function'){
//             str(res);
//         }
//         return _;
//     }
// }

function get( obj ) {
    let pending = 0
        , res     = {}
        , callback
        , done;

    return function _( arg ) {
        switch(typeof arg) {
            case 'function':
                callback = arg;
                break;
            case 'string':
                ++pending;
                obj[ arg ](function( err, val ) {
                    if( done ) return;
                    if( err ) return done = true, callback(err);
                    res[ arg ] = val;
                    --pending || callback(null, res);
                });
                break;
        }
        return _;
    };
}



// console.log(typeof queue);
// queue.on('job enqueue', function (id, type) {
//     console.log('Job %s got queued of type %s', id, type);
// });

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

// kue.Job.rangeByType('get_tieba_list', 'active', 0, -1, 'asc', function (err, jobs) {
//     // console.log(jobs);
// });
//
// kue.Job.rangeByState('active', 0, -1, 'asc', function (err, jobs) {
//     // you have an array of maximum n Job objects here
//     console.log(jobs.length);
// });

