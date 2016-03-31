var router = require('express').Router();
var db = require('mongodb').MongoClient.connect('mongodb://localhost/test');
var Q = require('q');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;



passport.use('ppget', new LocalStrategy({
        passReqToCallback: true
    },
    function(req, username, password, done) {
        var info = {}
        if (req.session && !!req.session.user && !!req.session.user.username)
            info.username = req.session.user.username;
        return done(null, info);
    }
));


passport.use('pppost', new LocalStrategy({
        passReqToCallback: true
    },
    function(req, username, password, done) {
        var user = req.body;
        console.log(user);
    // TODO, check username and password
        if (!user || !user.username || !user.password) {
            return done(null, false, {
                msg: 'username or password is needed'
            });
        }
        db.then(function(db) {
            // check user exists and valid
            return db.collection('users').find(user).toArray()
        }).then(function(users) {
            if (!users || users.length == 0) {
                return done(null, false, {
                    msg: 'username and password not matched'
                });
            }
            var deferred = Q.defer();
            req.session.user = users[0];
            req.session.save(function(err) {
                if (err) deferred.reject(err)
                else deferred.resolve({
                    username: user.username
                })
            })
            return deferred.promise;
        }).then(function(info) {
            return done(null, info)
        }).catch(function(err) {
            console.log('login fail', err);
            next(err);
        });
    }
));

router.get('/', function(req, res, next) {
    passport.authenticate('ppget', function(err, user, info) {
        console.log(err, user, info);
        if (err) {
            return next(err);
        }
        if (!!info) {
            return res.json(info);
        }
        else res.json(user);
    })(req, res, next);
});

router.post('/', function(req, res, next){
    passport.authenticate('pppost', function(err, user, info){
        console.log(err, user, info);
        if (!!info) {
            res.json(info);
        }
        else res.json(user);
    })(req, res, next);
});

/*router.get('/', function(req, res, next) {
    var info = {}
    if (req.session && !!req.session.user && !!req.session.user.username)
        info.username = req.session.user.username;
    res.json(info)
});

router.post('/', function(req, res, next) {
    var user = req.body;
    // TODO, check username and password
    if (!user || !user.username || !user.password) {
        res.json({
            msg: 'username or password is needed'
        })
        return;
    }
    db.then(function(db) {
        // check user exists and valid
        return db.collection('users').find(user).toArray()
    }).then(function(users) {
        if (!users || users.length == 0) {
            return {
                msg: 'username and password not matched'
            };
        }
        var deferred = Q.defer();
        req.session.user = users[0];
        req.session.save(function(err) {
            if (err) deferred.reject(err)
            else deferred.resolve({
                username: user.username
            })
        })
        return deferred.promise;
    }).then(function(info) {
        res.json(info)
    }).catch(function(err) {
        console.log('login fail', err);
        next(err);
    });
}); */

router.delete('/', function(req, res, next) {
    req.session.destroy(function(err) {
        if (err) next(err)
        else res.json({})
    })
})

module.exports = router;
