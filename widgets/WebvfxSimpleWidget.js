var WebvfxSimpleWidget = function(options) {

    this.feed = null;
    this.created = false;
    this.count = 0;

    this.initialize = function() {

        var self = this;
        this.options = $.extend(true, {

            id: '',
            type: 'text',
            el: $('body'),
            text: '',
            interval: 500,
            increment: 2,
            animation: 'none',

            style: {
                display: 'block',
                position: 'absolute',
                overflow: 'hidden',
                'box-sizing': 'border-box', // yeah!
            },

            success: function(self) {
                self.el.html(self.getText());
            },

        }, options);

        if (this.options.type == 'time') {
            this.feed = TimeFeed;
        }
        if (this.options.type == 'weather') {
            this.feed = WeatherFeed;
            this.feed.woeid = this.options.woeid;
        }

        if (this.feed && !this.feed.started) {
            var self = this;
            this.feed.on('updated', function() {
                if (!self.created) {
                    self.create();
                    self.cycle();
                }
            });
            this.feed.start();
        } else {
            self.create();
            self.cycle();
        }

    };

    this.getText = function() {

        var text = this.parseText(this.options.text);
        if (this.options.animation == 'onebyone') {
            chunks = text.split("\n");
            text = chunks[this.count];
            if (this.created) {
                this.count = (this.count < chunks.length - 1) ? this.count + 1 : 0;
            }
        }
        return text;

    };

    this.parseText = function(text) {

        if (this.feed) {
            for (i in this.feed.data) {
                text = text.replace('%' + i, this.feed.data[i]);
            }
        }
        return text;

    };

    this.create = function() {

        var text = this.getText();

        this.widget = $('<div/>')
                      .attr({id: this.options.id})
                      .css(this.options.style);
        this.options.el.append(this.widget);

        if (this.options.animation == 'marquee') {
            this.count = this.widget.width();
            this.marquee = $('<div />').html(text).css({
                               position: 'absolute',
                               'white-space': 'pre',
                               left: this.count + 'px',
                           });
            this.widget.append(this.marquee);
            this.marqueeWidth = this.marquee.width();
            this.el = this.marquee;
        } else {
            this.widget.html(text);
            this.el = this.widget;
        }

        this.widgetWidth = this.widget.width();
        this.created = true;

    };

    this.remove = function() {

        this.widget.remove();
        console.debug('remove', this.options.id);

    };

    this.hide = function() {

        if (this.widget.is(':visible')) {
            this.widget.hide();
        }

    },

    this.cycle = function() {

        if ($('#' + this.options.id).length) {
            if (this.options.animation == 'marquee') {
                this.count = (this.count < -this.marqueeWidth)
                             ? this.widgetWidth
                             : this.count - this.options.increment;
                this.marquee.css({left: this.count})
            }

            this.options.success(this);

            if (this.feed || this.options.animation != 'none') {
                var self = this;
                var t = setTimeout(function() {self.cycle()}, self.options.interval);
            }
        }

    };

    this.initialize();

};

var TimeFeed = {

    data: {},
    interval: 500,
    started: false,

    checkTime: function(i) {
        return (i < 10) ? '0' + i : i;
    },

    getData: function() {
        console.debug('updating time feed');

        var today = new Date();
        this.data = {
            H: today.getHours(),
            M: TimeFeed.checkTime(today.getMinutes()),
            S: TimeFeed.checkTime(today.getSeconds()),
        };
        $(this).trigger('updated');
        var t = setTimeout(function(){ TimeFeed.getData() }, TimeFeed.interval);
    },

    on: function(event, handler) {
        $(this).on(event, handler);
    },

    start: function() {
        if (!this.started) {
            console.debug('starting time feed');
            this.started = true;
            this.getData();
        }
    },

};

var WeatherFeed = {

    data: {},
    interval: 60000,
    woeid: 0,
    unit: 'c',
    started: false,

    getData: function() {
        console.debug('updating weather feed');

        var now = new Date();
        var rnd = now.getDay() + now.getHours() + now.getMinutes();
        var weatherUrl = 'http://query.yahooapis.com/v1/public/yql?format=json&rnd=' + rnd +
                         '&q=select * from weather.forecast where woeid=' + WeatherFeed.woeid +
                         ' and u="' + WeatherFeed.unit + '"';

        var self = this;
        $.getJSON(weatherUrl, function(data) {
            if (data !== null && data.query.results !== null &&
                data.query.results.channel.description !== 'Yahoo! Weather Error') {
                self.data = {
                    T: data.query.results.channel.item.condition.temp,
                    H: data.query.results.channel.atmosphere.humidity,
                    Tunit: '°' + data.query.results.channel.units.temperature,
                    Hunit: '%',
                };
                $(self).trigger('updated');
            }
            var t = setTimeout(function(){ WeatherFeed.getData() }, WeatherFeed.interval);
        });
    },

    on: function(event, handler) {
        $(this).on(event, handler);
    },

    start: function() {
        if (!this.started) {
            console.debug('starting weather feed');
            this.started = true;
            this.getData();
        }
    },

};

var WebvfxSimpleWidgetStyles = {

    transparent: {
        color: 'white',
        'font-family': 'ShareRegular',
        'font-size': '20px',
        'text-align': 'center',
        background: 'none',
        border: 'none',
        'border-radius': '0px',
    },

    black: {
        color: 'white',
        'font-family': 'ShareRegular',
        'font-size': '20px',
        'text-align': 'center',
        background: '-webkit-linear-gradient(top, rgba(19,19,19,1) 0%, rgba(28,28,28,1) 9%, rgba(43,43,43,1) 24%, rgba(17,17,17,1) 40%, rgba(0,0,0,1) 49%, rgba(44,44,44,1) 50%, rgba(71,71,71,1) 61%, rgba(102,102,102,1) 75%, rgba(89,89,89,1) 88%, rgba(76,76,76,1) 100%)',
    },

    gray: {
        color: 'white',
        'font-family': 'ShareRegular',
        'font-size': '18px',
        'text-align': 'center',
        background: '-webkit-linear-gradient(top, rgba(180,180,180,1) 0%,rgba(83,83,83,1) 46%,rgba(75,75,75,1) 50%,rgba(81,81,81,1) 53%,rgba(129,129,129,1) 76%,rgba(114,114,114,1) 87%,rgba(93,93,93,1) 100%)',
    },

    heaven: {
        color: 'white',
        'font-family': 'ShareRegular',
        'font-size': '32px',
        'text-align': 'center',
        background: '-webkit-linear-gradient(top, rgba(109,179,242,1) 0%,rgba(84,163,238,1) 19%,rgba(54,144,240,1) 35%,rgba(30,105,222,1) 58%,rgba(84,163,238,1) 100%)',
    },

    fire: {
        color: 'black',
        'font-family': 'ShareRegular',
        'font-size': '32px',
        'text-align': 'center',
        background: '-webkit-linear-gradient(top, rgba(255,214,94,1) 0%,rgba(254,191,4,1) 100%)',
    },

    'border-1': {
        'border-width': '1px',
        'border-style': 'solid',
    },

    'border-2': {
        'border-width': '2px',
        'border-style': 'solid',
    },

    'border-3': {
        'border-width': '3px',
        'border-style': 'solid',
    },

    'border-5': {
        'border-width': '5px',
        'border-style': 'solid',
    },

    'border-10': {
        'border-width': '10px',
        'border-style': 'solid',
    },

    'no-border': { 'border-width': '0px' },

    'border-radius-5': { 'border-radius': '5px' },

    'border-radius-10': { 'border-radius': '10px' },

    'border-radius-15': { 'border-radius': '15px' },

    'border-radius-25': { 'border-radius': '25px' },

    'border-radius-50': { 'border-radius': '50px' },

    'no-border-radius': { 'border-radius': '0px' },
};

var WebvfxSimpleWidgetFonts = {

    getFont: function(name) {
        return "<style type='text/css'>" +
               "@font-face{ font-family: " + name + ";" +
               "src: url(data:font/ttf;base64," + window['fonts_' + name] + ") " +
               "format('truetype'); }" +
               "</style>";
    },

};
