var _ = require('underscore');
var logger = require('../logger')().addLogger('mongodb_connection');

exports = module.exports = function(config, error) {
    var conf = require('config');
    var mediadb = config || conf.Common.MediaDB;
    var collections = conf.Common.Collections;
    var search = conf.Search;
    var events = ['close', 'timeout', 'error'];
    var getParameterObj = { getParameter:1, textSearchEnabled:1 };
    var db = require('mongoskin').db(mediadb.dbHost + ':' + mediadb.dbPort + '/' + '?auto_reconnect', {
        database: mediadb.dbName,
        username: mediadb.dbUser,
        password: mediadb.dbPassword,
        safe: true
    });

    error = error || function (err) {logger.error ('Unhandled error in mongodb: ' + err);};

    db.admin.command(getParameterObj, function(err, result) {
        if(err) { logger.error('Error: ' + err); return error(err); }
        logger.info("Connected to", mediadb);
        if(result.documents[0].textSearchEnabled) {
            for(col in collections) {
                var aFulltext = null;

                if (search[col])
                    aFulltext = search[col].fulltext;

                if(aFulltext && aFulltext.length) {
                    var indexes = _.object(aFulltext, _.map(aFulltext, function(i) { return 'text'; }));

                    //For all text fields { "$**": "text" }, { name: "TextIndex" }
                    db.ensureIndex(collections[col], indexes, { background: true }, function(err, idx) {
                        if(err) logger.error('err: ', err, ' on ', idx );
                    });
                }
            };
            logger.info("Mongo Fulltext Search Enabled");
        } else {
            logger.info("Mongo Fulltext Search is not supported");
        }
    });

    //listen for events
    events.forEach(function (event) {
        db.on(event, function () {
            logger.info(event, arguments)
        });
    });

    return db;
}
