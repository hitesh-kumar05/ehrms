/**
 * Created with JetBrains WebStorm.
 * User: krishna
 * Date: 31/7/15
 * Time: 6:12 PM
 * To change this template use File | Settings | File Templates.
 */
var bcrypt   = require('bcrypt-nodejs');

var encrypt = function(text){

    return bcrypt.hashSync(text);
}

var checkPassword = function(encrypted, nonencrypted, callback){
    bcrypt.compare(nonencrypted, encrypted, function(err, res) {
        if(res === true){
            return callback(null, true);
        }
        else{
            return callback(null, false);
        }
    });
}

module.exports.encrypt = encrypt;
module.exports.checkPassword = checkPassword;
