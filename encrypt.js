const crypto = require('crypto'); 

// They probably don't need to be async.
function hashPasswd(plainPassword, secretKey, callback) {
    // generates sha256 hash
    let hash = crypto.createHmac('sha256', secretKey)
                    .update(plainPassword)
                    .digest('hex');
    // Passes the value of hash
    callback(hash);
}

function generateRandomToken(callback){
    // generates ramdom 32 bytes string
    crypto.randomBytes(32, function(err, buffer) {
        let token = buffer.toString('hex');
        callback(token);
      });
}

exports.hashPasswd = hashPasswd;/* Need to change this later */
exports.generateRandomToken = generateRandomToken;