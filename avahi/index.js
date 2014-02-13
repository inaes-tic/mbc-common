var mdns   = require('mdns2'),
    uuid   = require('node-uuid'),
    logger = require("../logger")().addLogger('avahi')
;

/*
 * Basic helper to announce services using mdns / avahi.
 *
 * client_id is an unique token used to identify this particular instance. If
 * not given, an uuid is created.
 * namespace is the prefix used to distinguish the services. Defaults to 'MBC'
 */
var avahi = exports = module.exports = function (client_id, namespace) {
    var self = this;

    self.client_id = client_id || uuid.v4();
    self.namespace = namespace || 'MBC';

    self.services = {};

    return self;
};

/*
 * Announces a service on the network.
 *
 * The only required parameters are 'service_name' and 'port'.
 * The parameter 'iface' is optional and can be either something like 'eth0'
 * or also an address like '192.168.1.7'.
 */
avahi.prototype.announce = function (service_name, port, iface) {
    var self = this;

    if (!port || !service_name) {
        logger.error('announce(): service_name and port are required parameters');
        return;
    }

    var txtRecord = {
        namespace: self.namespace,
        name: service_name,
        uuid: self.client_id
    };

    var options = {
        txtRecord: txtRecord,
        name: service_name + '.' + self.client_id,
    };

    if (iface) {
        options.networkInterface = iface;
    }

    var ann = mdns.createAdvertisement(mdns.tcp(self.namespace), port, options);
    ann.start();

    var ann = mdns.createAdvertisement(mdns.tcp('http'), port, options);
    ann.start();
};
