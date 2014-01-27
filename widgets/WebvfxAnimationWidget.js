var WebvfxAnimationWidget = function(options) {

    this.initialize = function() {

        $.extend(this, {
            element_id: '',
            el: $('body'),
            zindex: 0,
            name: '',
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
            '100% { background-position: -' + (this.width * this.frames) + 'px 0; }'
        );

    };

    this.create = function() {

        this.animationName = 'play-' + this.element_id + (new Date()).getTime();
        this.addCssKeyframes();

        var animationDuration = (this.frames / this.frameRate) + 's';

        this.widget = $('<div />');
        this.widget.attr('id', this.element_id);
        this.widget.css({
            position: 'absolute',
            'z-index': this.zindex,
            width: this.width + 'px',
            height: this.height + 'px',
            top: this.top + 'px',
            left: this.left + 'px',
            'background-image': 'url(' + this.path + this.name + ')',
            'background-repeat': 'no-repeat',
            'background-position': 'left top',
            'background-size':  (this.width * this.frames) + 'px ' + this.height + 'px',
            '-webkit-animation': this.animationName + ' ' + animationDuration + ' steps(' + this.frames + ') infinite',
        });

        this.el.append(this.widget);

    };

    this.remove = function() {

        this.widget.remove();
        $(this.style).remove();

    };

    this.initialize();

};
