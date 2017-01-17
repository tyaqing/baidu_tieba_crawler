let mongoose = require('mongoose');

mongoose.Promise = global.Promise;
mongoose.connect('mongodb://127.0.0.1/test/');
// mongoose.set('debug', true)

let ObjectId = mongoose.Types.ObjectId;

Schema = mongoose.Schema;
let db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function (callback) {
    console.log('---mongodb 链接成功---');
});


let TiebaSchema = new Schema({
    _id       : {type: String, unique: true},
    kw        : {type: String, unique: true},
    page_sum  : Number,
    follow_sum: Number,
    topic_sum : Number,
    post_sum  : Number,
    head_img  : String,
    creat_time: {type: Date, default: Date.now()},
});

let PostSchema = new Schema({
    _id        : {type: String, unique: true},
    user_id    : {type: String, ref: 'User'},
    kw         : String,
    fid        : {type: String, ref: 'Tieba'},
    user_name  : String,
    title      : String,
    href       : String,
    postlist   : Array,
    last_update: {type: Date, default: Date.now()}

});

let UserSchema = new Schema({
    _id        : String,
    user_id    : String,
    is_verify  : Array,
    vip_day    : Number,
    vip_level  : Number,
    is_official: Array,
    name       : String,
    user_age   : Number,
    post_total : Number,
    portrait   : String,
    sex        : String,
    open_type  : String,
    tieba_list : Array,
    last_update: {type: Date, default: Date.now()}
});

exports.Post  = mongoose.model('Post', PostSchema);
exports.User  = mongoose.model('User', UserSchema);
exports.Tieba = mongoose.model('Tieba', TiebaSchema);
