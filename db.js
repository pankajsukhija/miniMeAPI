// https://cloud.mongodb.com/v2/5c9214df9ccf64379b624957#clusters
// https://cloud.mongodb.com/v2/5c9214df9ccf64379b624957#metrics/replicaSet/5c92158f3f4845e71820dc30/explorer/testDB/users/find
const MongoClient = require("mongodb").MongoClient;
const configFile = require("./config.json");
const encrypt = require("./encrypt.js");

const dbURL = configFile.MongoDBConfig.uri;
const dbName = configFile.MongoDBConfig.dbName;
const secretKey = configFile.secretKey;

function regUser(username, passwd, email, dbRes){
    // dbRes is the callback function.
    // Database is created automatically when a document is added to collection.
    // http://localhost:8080/regUser?username=testtest&passwd=testtest&email=testtest%40pokemon.com
    MongoClient.connect(dbURL, { useNewUrlParser: true },  (err, client) => {
        if (err) dbRes({msg : "ERROR"}); // Not loggig errors for now.
        else {
            const collection = client.db(dbName).collection("users");

            // Checks if username OR email already exists in collection.
            collection.find({$or:[{"username" : username},{"email" : email}]}).toArray( (err, result) => {
                if (err) dbRes({msg : "ERROR"});
                else if (result.length !== 0){
                    dbRes({msg : "EXIST"});
                    client.close;
                }
                else {
                    // Encrypt password to sha256
                    encrypt.hashPasswd(passwd, secretKey, (hash) => {
                        let dataObject = {
                            username : username,
                            passwdHash : hash,
                            email : email,
                            accessLevel : 0, //** */
                            isActive : 1, /** */ 
                            lastLogin : null, /** */
                            about : null, /** */
                        };
                        // Inserst document to collection.
                        collection.insertOne(dataObject, (err) => {
                            if (err) dbRes({msg : "ERROR"});
                            else {
                                dbRes({msg : "SUCCESS"});
                                client.close;
                                // And this my friend, is called the Callback Hell.
                            }
                        });
                    });  
                }
            });
        }
  });
}

function authUser(username, passwd, dbRes){
    MongoClient.connect(dbURL, { useNewUrlParser: true },  (err, client) => {
        // Will find a better to do this.
        // Maybe create seprate function to connect. 
        if (err) dbRes({msg : "ERROR"});
        else {
            const collection = client.db(dbName).collection("users");
            encrypt.hashPasswd(passwd, secretKey, (hash) => {
                let passwdHash = hash;
                // Test if username and passHash matches those in the collection/
                collection.find({$and : [{"username" : username},{"passwdHash" : passwdHash}]}).toArray( (err, result) => {
                    if (err) dbRes({msg : "ERROR"});
                    else if (result.length == 1){
                        encrypt.generateRandomToken(token => {
                            // Use another collection to store token
                            // Which I think may not be the best way here.
                            let collection = client.db(dbName).collection("accessTokens");
                            let dataObject = {
                                username : username,
                                token : token,
                                validity : null // Not implemented yet. 
                            }
                            collection.insertOne(dataObject, (err) => {
                                // Update last login using currentDate operator where username = ?
                                let collection = client.db(dbName).collection("users");
                                collection.updateOne({"username" : username}, {$currentDate : {
                                    lastLogin : true,
                                 }}, (err) => {
                                    if (err) dbRes({msg: "ERROR"});
                                    else{
                                        dbRes({
                                            msg : "SUCCESS",
                                            token : token});
                                    }
                                });
                            })
                        });}
                    else{
                        dbRes({msg : "INVALID"});
                    }
                });
            });
        }
    });
}

function updateAbout(username, token, about, dbRes){
    MongoClient.connect(dbURL, { useNewUrlParser: true },  (err, client) => {
        if (err) dbRes({msg : "ERROR"});
        else{
            let collection = client.db(dbName).collection("accessTokens");
            // Test is access token is valid
            collection.find({$and : [{"username" : username},{"token" : token}]}).toArray( (err, result) => {
                if (err) dbRes({msg : "ERROR"});
                else if (result.length == 1){
                    // Update `about` field in document
                    let collection = client.db(dbName).collection("users");
                    collection.updateOne({"username" : username}, {$set : {
                        "about" : about
                     }}, (err) => {
                        if (err) dbRes({msg: "ERROR"});
                        else{
                            dbRes({msg : "SUCCESS"});
                        }
                    });
                }else{
                    dbRes({msg : "INVALID"});
                }
            });
        }
    });
}

exports.regUser = regUser;
exports.authUser = authUser;
exports.updateAbout = updateAbout;