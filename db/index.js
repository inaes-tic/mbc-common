exports = module.exports = function(config) {
    var conf = config || require('config').Common.MediaDB;
    var db = require('mongoskin').db(conf.dbHost + ':' + conf.dbPort + '/' + '?auto_reconnect', {
        database: conf.dbName,
        username: conf.dbUser,
        password: conf.dbPassword,
        safe: true
    });
    return db;
}
