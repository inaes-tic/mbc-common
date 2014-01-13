var WebvfxAnimationWidget = function(options) {

    this.initialize = function() {

        this.options = $.extend(true, {
            id: '',
            zindex: 0,
            image: '',
            frames: 0,
            frameRate: 0,
            width: 0,
            height: 0,
            top: 0,
            left: 0,
        }, options);

        this.create();

    };

    this.createSheet = function() {

        this.style = document.createElement('style');
        this.style.appendChild(document.createTextNode(""));
        document.head.appendChild(this.style);
        return this.style.sheet;

    };

    this.addCssKeyframes = function() {

        this.createSheet().addRule(
            '@-webkit-keyframes ' + this.animationName,
            '0% { background-position: 0px 0; } ' +
            '100% { background-position: -' + (this.options.width * this.options.frames) + 'px 0; }'
        );

    };

    this.create = function() {

        this.animationName = 'play-' + this.options.id + (new Date()).getTime();
        this.addCssKeyframes();

        var animationDuration = (this.options.frames / this.options.frameRate) + 's';

        this.widget = $('<div />');
        this.widget.attr('id', this.options.id);
        this.widget.css({
            position: 'absolute',
            'z-index': this.options.zindex,
            width: this.options.width + 'px',
            height: this.options.height + 'px',
            top: this.options.top + 'px',
            left: this.options.left + 'px',
            'background-image': 'url(' + this.options.image + ')',
            'background-repeat': 'no-repeat',
            'background-position': 'left top',
            'background-size':  (this.options.width * this.options.frames) + 'px ' + this.options.height + 'px',
            '-webkit-animation': this.animationName + ' ' + animationDuration + ' steps(' + this.options.frames + ') infinite',
        });

        $('body').append(this.widget);

    };

    this.remove = function() {

        this.widget.remove();
        $(this.style).remove();

    };

    this.initialize();

};
