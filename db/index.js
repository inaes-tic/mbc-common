var _ = require('underscore');

exports = module.exports = function(config) {
    var conf = config || require('config').Common.MediaDB;
    var cols = require('config').Search;
    var getParameterObj = { getParameter:1, textSearchEnabled:1 };
    var db = require('mongoskin').db(conf.dbHost + ':' + conf.dbPort + '/' + '?auto_reconnect', {
        database: conf.dbName,
        username: conf.dbUser,
        password: conf.dbPassword,
        safe: true
    });

    db.admin.command(getParameterObj, function(err, result) {
        if(result.documents[0].textSearchEnabled) {
            for(col in cols) {
                var aFulltext = cols[col].fulltext;
                if(aFulltext) {
                    var indexes = _.object(aFulltext, _.map(aFulltext, function(i) { return 'text'; }));

                    //XXX hack idx to lower case == mongo collection
                    var col = col.toLowerCase();

                    //For all text fields { "$**": "text" }, { name: "TextIndex" }
                    db.ensureIndex(col.toLowerCase(), indexes, { background: true }, function(err, idx) {
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
