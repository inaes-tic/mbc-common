exports = module.exports = function(config) {
    var conf = config || require('config').Common.MediaDB;
    var db = require('mongoskin').db(conf.dbHost + ':' + conf.dbPort + '/' + conf.dbName + '?auto_reconnect', {safe:true});
    return db;
}
