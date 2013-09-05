var _ = require('underscore');

exports = module.exports = function(config) {
    var conf = require('config');
    var mediadb = config || conf.Common.MediaDB;
    var collections = conf.Common.Collections;
    var search = conf.Search;
    var getParameterObj = { getParameter:1, textSearchEnabled:1 };
    var db = require('mongoskin').db(mediadb.dbHost + ':' + mediadb.dbPort + '/' + '?auto_reconnect', {
        database: mediadb.dbName,
        username: mediadb.dbUser,
        password: mediadb.dbPassword,
        safe: true
    });

    db.admin.command(getParameterObj, function(err, result) {
        if(err) { console.log(err); return; }
        if(result.documents[0].textSearchEnabled) {
            for(col in collections) {
                var aFulltext = search[col].fulltext;
                if(aFulltext && aFulltext.length) {
                    var indexes = _.object(aFulltext, _.map(aFulltext, function(i) { return 'text'; }));

                    //For all text fields { "$**": "text" }, { name: "TextIndex" }
                    db.ensureIndex(collections[col], indexes, { background: true }, function(err, idx) {
                        if(err) console.log('err: ', err, ' on ', idx );
                    });
                }
            };
        } else {
            console.log("Mongo Fulltext Search is not supported");
        }
    });

    return db;
}
