/**
 * Created by ArH on 2017/1/11.
 */
module.exports = function( type ) {

    return function( req, res ) {
        console.log(type);
        console.log('shoudao');
        // if( req.accepts(type) );

    }
};