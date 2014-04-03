var config    = require("config"),
    moment    = require("moment"),
    _         = require("underscore"),
    Backbone  = require("backbone"),
    publisher = require('../pubsub')(),
    logger    = require("../logger")().addLogger('configBootstrap'),
    iocompat  = require("../models/iocompat")
;

exports = module.exports = bootstrapHelper;

function bootstrapHelper (configbackend) {
    var self = this;
    _.extend(this, Backbone.Events);
    if (!configbackend) {
        logger.error('bootstrapHelper: need to pass the config iobackend');
        return;
    }

    if (config.timestamp == undefined) {
        config.timestamp = 0;
    }

    this.backend   = configbackend;
    this.channel   = '_RedisSync.' + configbackend.io.name;
    this.client_id = iocompat.client_id;

    _.bindAll(this, '_onRedisAnswer', '_onRedisRequest');

    this.backend.io.on('redis:configBootstrapAnswer', this._onRedisAnswer);
    this.backend.io.on('redis:configBootstrapRequest', this._onRedisRequest);

    config.watch(config, null, this._onConfigChanged);
};

bootstrapHelper.prototype.requestConfig = function() {
    var self = this;

    setTimeout(function() {
        self._onRedisRequest();
        publisher.publishJSON(self.channel, { model: {}, method: 'configBootstrapRequest', _redis_source: self.client_id});
    }, 500);
};

bootstrapHelper.prototype._onConfigChanged = _.debounce(function(object, propertyName, priorValue, newValue) {
    if (propertyName == 'timestamp') {
        return;
    }
    config.timestamp = (new moment()).unix()
}, 100);

bootstrapHelper.prototype._onRedisRequest = function(model) {
    var pay = { model: config, method: 'configBootstrapAnswer', _redis_source: this.client_id};
    publisher.publishJSON(this.channel, pay);
};

bootstrapHelper.prototype._onRedisAnswer = function(model) {
    var self = this;
    var timestamp = (config.timestamp == undefined) ? 0 : config.timestamp;

    this.trigger('gotRedisAnswer');

    function emitUpdate(mdl) {
        var pay = []

        pay.push( _.extend(mdl, {type: 'config'}) );
        pay.push( _.extend(config.getOriginalConfig(), { type: 'defaults'}) );
        pay.push( _.extend(config.getSchemaValidator(), { type: 'descriptions'}) );

        self.backend.io.emit('updated', pay);
    }

    if ((model.timestamp != undefined) && (model.timestamp > timestamp)){
        config._extendDeep(config, model);
        config.timestamp = model.timestamp;
        emitUpdate(config);
        this.trigger('configUpdated');
    }
};
