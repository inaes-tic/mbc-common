exports = module.exports = function(config) {
    var conf = config || {
        dbName: "mediadb",
        dbHost: "localhost",
        dbPort: 27017
    };
    var db = require('mongoskin').db(conf.dbHost + ':' + conf.dbPort + '/' + conf.dbName + '?auto_reconnect', {safe:true});
    return db;
}
