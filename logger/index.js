var winston = require('winston'),
    moment  = require('moment'),
    _ = require('underscore'),
    level   = process.env.LOG_LEVEL || 'debug';

//Default winston log levels
var defaultLevels = {
    levels: {
        silly:   0,
        debug:   1,
        verbose: 2,
        info:    3,
        warn:    4,
        error:   5
    },
    colors: {
        silly:   'black',
        debug:   'blue',
        verbose: 'cyan',
        info:    'green',
        warn:    'yellow',
        error:   'red'
    }
};

var getTimestamp = function() {
    return moment().format('YYYY-MM-DD HH:mm:ss.SSS');
};

var general = new (winston.Logger)({
    transports: [
        new (winston.transports.File)({
            filename: './logs/general.log',
            handleExceptions: true,
            level: 'debug',
            timestamp: getTimestamp,
            json: false,
            maxsize: 10485760,
            maxFiles: 5
        })
    ],
    exitOnError: false
});

var logger = {
    addLogger: function(category) {
        winston.loggers.add(category, {
            transports: [
                new winston.transports.Console({
                    colorize: true,
                    level: level,
                    label: category,
                    timestamp: getTimestamp,
                }),
                new winston.transports.File({
                    filename: './logs/' + category + '.log',
                    level: 'debug',
                    timestamp: getTimestamp,
                    json: false,
                    maxsize: 10485760,
                    maxFiles: 5,
                })
            ],
        });
        winston.addColors(defaultLevels.colors);
        winston.loggers.get(category).exitOnError = false;
        return logger.getLogger(category);
    },
    getLogger: function(category) {
        var log = function(level) {
            var _wlogger = winston.loggers.get(category);
            var _label = "[" + category + "] ";
            var _getArguments = function() {
                var args = Array.prototype.slice.call(arguments);
                return args;
            };
            var ret = function() {
                var args = _getArguments.apply(this, arguments);
                _wlogger[level].apply(_wlogger, args);
                args[0] = _label + args[0];
                general[level].apply(general, args);
            };
            return ret;
        };

        var keys = _.keys(defaultLevels.levels);
        var tmp = _.object(keys, _.map(keys, function(key) { return log(key); }));
        return tmp;
    }
};

exports = module.exports = function() { return logger };
