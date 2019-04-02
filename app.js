const express = require("express");
const { check, validationResult } = require('express-validator/check');
const db = require("./db");
const app = express();

app.get("/", (req, res) => {
    res.send("<h1>Hello :)</h1>");
});

// Using GET method only for easy testing, will change later to POST
app.get("/regUser",
    // Not safe from MongoDB Injection I believe.
    [check("email").trim().isEmail().normalizeEmail().isLength({max : 100}),
    check("passwd").exists().isLength({min : 8, max : 32}),
    check("username").trim().isAlpha().exists().isLength({min: 5, max : 20})],
    (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
        }else {
            // Username is converted to lowercase
            let username = req.query.username.toLowerCase() ;
            let passwd = req.query.passwd;
            let email = req.query.email;
            db.regUser(username, passwd, email, (dbRes) => {
                // this is the response we recive from database using a callback func.
                res.json(dbRes);
            });
        }
    
});

app.get("/authUser", (req, res) => {
    let username = req.query.username.toLowerCase();
    let passwd = req.query.passwd;
    db.authUser(username, passwd, (dbRes) => {
        res.json(dbRes);
    });
});

app.get("/updateAbout",
// currently only accepting alpha numberic value for testing 
[check("about").is.isLength({min : 1, max : 300})], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
    }else{
        let username = req.query.username.toLowerCase();
        let token = req.query.token;
        let about = req.query.about;
        db.updateAbout(username, token, about, dbRes => {
            res.json(dbRes);
        });
    }}
);

app.get("/latestUsers", (req, res) => {
    // Fetches 6 latest users and their about section from DB.
    db.latestUsers(result => {
        res.json(result);
    });
});

app.get("/reqUser", (req, res) => {
    // Public can request Profile of users without a token.
    let username = req.query.username.toLowerCase();
    db.reqProfile(username, (dbRes) => {
        res.json(dbRes);
    });
});

app.listen(8080);
