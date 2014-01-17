window.WebvfxEditor = Backbone.Model.extend({

    defaults: {
        width: 0,
        height: 0,
        scale: 1,
        stage: null,
        server: '',
        actionSafe: {
            width: 0,
            height: 0
        },
        titleSafe: {
            width: 0,
            height: 0
        },
        realTimeEdition: false,
        showSafeArea: false,
        videoPreview: false,
        liveCollection: null,
    },

    initialize: function() {
        args = arguments[0];

        this.set('width', args.width);
        this.set('height', args.height);
        this.set('scale', args.scale);

        this.set('stage', new Kinetic.Stage({
            container: 'container',
            width: this.getScaledWidth(),
            height: this.getScaledHeight(),
        }));
        this.get('stage').add(
            (('layer' in args) ? args.layer : new Kinetic.Layer())
        );

        var actionPercentage = 0.9;
        this.set('actionSafe', {
            width:  Math.round(args.width * args.scale * actionPercentage),
            height: Math.round(args.height * args.scale * actionPercentage),
        });

        var tilePercentage = 0.8;
        this.set('titleSafe', {
            width:  Math.round(args.width * args.scale * tilePercentage),
            height: Math.round(args.height * args.scale * tilePercentage),
        });

        this.set('server', args.server);
        this.set('realTimeEdition', args.realTimeEdition);
        this.set('showSafeArea', args.showSafeArea);
        this.set('videoPreview', args.videoPreview);
        this.set('liveCollection', new Sketch.LiveCollection());
    },

    getScaledWidth: function() {
        return (this.get('width') * this.get('scale'));
    },

    getScaledHeight: function() {
        return (this.get('height') * this.get('scale'));
    },

    getLayer: function() {
        return this.get('stage').children[0];
    },

    add: function(obj) {
        this.getLayer().add(obj);
    },

    draw: function() {
        this.getLayer().draw();
    },

});

window.WebvfxBase = Backbone.Model.extend({

    defaults: {
        name: '',
        width: 0,
        height: 0,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },

    initialize: function() {
        this.id = this.cid;
        this.zindex = (arguments[0].zindex >= 0) ? arguments[0].zindex : -1;
        this.locked = false;
        this.created = false;
    },

    createEvents: function() {
        var self = this;

        this.kObj.on('mouseover', function() {
            document.body.style.cursor = 'pointer';
        });

        this.kObj.on('dragmove', function() {
            self.updatePosition();
            self.showInfo();
        });

        this.kObj.on('dragend', function() {
            if (self.created && webvfxEditor.get('realTimeEdition')) {
                webvfxEditor.objects.sendAll();
            }
        });

        this.kObj.on('mouseout', function() {
            document.body.style.cursor = 'default';
            $('#info').html('');
        });

        this.kObj.on('mousedown', function() {
            $('.webvfx-obj-properties').hide();
            $('#webvfx-obj-properties-' + self.id).show();
        });
    },

    draw: function() {
        webvfxEditor.draw();
        if (webvfxEditor.get('realTimeEdition')) {
            webvfxEditor.objects.sendAll();
        }
    },

    showInfo: function() {
        var info = this.getInfo();
        for (key in info) {
            $('#' + key + '-' + this.id).val(info[key]);
        }
    },

    isImage: function() {
        return this.getType() == 'image';
    },

    isBox: function() {
        return this.getType() == 'box';
    },

    isText: function() {
        return this.getType() == 'text';
    },

    isTime: function() {
        return this.getType() == 'time';
    },

    isWeather: function() {
        return this.getType() == 'weather';
    },

    isWidget: function() {
        return (this.isBox() || this.isText() || this.isTime() || this.isWeather());
    },

    isAnimation: function() {
        return this.getType() == 'animation';
    },

    getWidth: function() {
        return this.get('width');
    },

    getHeight: function() {
        return this.get('height');
    },

    getTop: function() {
        return this.get('top');
    },

    getLeft: function() {
        return this.get('left');
    },

    getRight: function() {
        return this.get('right');
    },

    getBottom: function() {
        return this.get('bottom');
    },

    getImage: function() {
        return this.kObj.children[0];
    },

    getInitialPosition: function(args) {
        var x = ('left' in args)
              ? ((typeof args.left == "string")
                 ? parseInt(args.left.replace('px', ''))
                 : args.left
                )
              : Math.ceil((webvfxEditor.get('width') - this.get('width')) / 2);

        var y = ('top' in args)
              ? ((typeof args.top == "string")
                 ? parseInt(args.top.replace('px', ''))
                 : args.top
                )
              : Math.ceil((webvfxEditor.get('height') - this.get('height')) / 2);

        return {x: x, y: y};
    },

    setSize: function(width, height) {
        this.set('width', width);
        this.set('height', height);
        var realWidth = width * webvfxEditor.get('scale');
        var realHeight = height * webvfxEditor.get('scale');
        if (this.isAnimation()) {
            var sprite = this.kObj.children[0];
            var image = sprite.getImage();
            var x = realWidth / (image.width / this.get('frames'));
            var y = realHeight / image.height;
            sprite.setScale(x, y);
        } else {
            this.getImage().setSize(realWidth, realHeight);
        }
        this.kObj.setSize(realWidth, realHeight);
        this.setPosition(this.get('left'), this.get('top'));
    },

    setPosition: function(x, y) {
        this.set('left', x);
        this.set('top', y);
        this.set('right', webvfxEditor.get('width') - x - this.get('width'));
        this.set('bottom', webvfxEditor.get('height') - y - this.get('height'));

        this.kObj.setAbsolutePosition(
            x * webvfxEditor.get('scale'),
            y * webvfxEditor.get('scale')
        );
        this.getImage().setPosition(0, 0);

        var size = this.kObj.getSize();
        this.kObj.get('.topLeft')[0].setPosition(0, 0);
        this.kObj.get('.topRight')[0].setPosition(size.width, 0);
        this.kObj.get('.bottomRight')[0].setPosition(size.width, size.height);
        this.kObj.get('.bottomLeft')[0].setPosition(0, size.height);
    },

    setTop: function(top) {
        this.setPosition(this.get('left'), top);
        this.draw();
    },

    setLeft: function(left) {
        this.setPosition(left, this.get('top'));
        this.draw();
    },

    setRight: function(right) {
        this.setPosition(
            webvfxEditor.get('width') - right - this.get('width'),
            this.get('top')
        );
        this.draw();
    },

    setBottom: function(bottom) {
        this.setPosition(
            this.get('left'),
            webvfxEditor.get('height') - bottom - this.get('height')
        );
        this.draw();
    },

    updatePosition: function() {
        var pos = this.kObj.getAbsolutePosition();
        this.set('top', Math.ceil(pos.y / webvfxEditor.get('scale')));
        this.set('left', Math.ceil(pos.x / webvfxEditor.get('scale')));
        this.set('bottom', webvfxEditor.get('height') - this.get('top') - this.get('height'));
        this.set('right', webvfxEditor.get('width') - this.get('left') - this.get('width'));
    },

    updateSize: function() {
        var size = this.getImage().getSize();
        this.set('width', Math.ceil(size.width / webvfxEditor.get('scale')));
        this.set('height', Math.ceil(size.height / webvfxEditor.get('scale')));
    },

    addAnchor: function(group, x, y, name) {
        var anchor = new Kinetic.Circle({
            x: x,
            y: y,
            stroke: '#666',
            fill: '#ddd',
            strokeWidth: 2,
            radius: 5,
            name: name,
            draggable: true,
            dragOnTop: false,
            visible: false,
        });

        var self = this;

        anchor.on('dragmove', function(e) {
            self.locked = true;
            self.update(this, e.shiftKey);
            self.updateSize();
            self.updatePosition();
        });

        anchor.on('mousedown touchstart', function() {
            group.setDraggable(false);
            this.moveToTop();
        });

        anchor.on('dragstart', function() {
            self._startHeight = self.get('height');
        });

        anchor.on('dragend', function() {
            group.setDraggable(true);
            self.locked = false;
            if (self.isWidget()) {
                var fontSize = Math.ceil(self.get('height') * self.getFontSize() / self._startHeight);
                self.reload({
                    style: { 'font-size': fontSize + 'px', }
                });
            }
        });

        anchor.on('mouseover', function() {
            document.body.style.cursor = 'pointer';
            this.setStrokeWidth(4);
            webvfxEditor.draw();
        });

        anchor.on('mouseout', function() {
            document.body.style.cursor = 'default';
            this.setStrokeWidth(2);
            webvfxEditor.draw();
        });

        group.add(anchor);
    },

    update: function(activeAnchor, fixed) {
        if (fixed) {
            console.log('Shift key pressed!');
        }

        var group = activeAnchor.getParent();
        var object = group.children[0];
        var topLeft = group.get('.topLeft')[0];
        var topRight = group.get('.topRight')[0];
        var bottomRight = group.get('.bottomRight')[0];
        var bottomLeft = group.get('.bottomLeft')[0];

        var anchorX = activeAnchor.getX();
        var anchorY = activeAnchor.getY();

        switch (activeAnchor.getName()) {
            case 'topLeft':
                if (fixed) {
                    var x = bottomRight.getX() - anchorX;
                    var y = x * object.getHeight() / object.getWidth();
                    topLeft.setY(bottomRight.getY() - y);
                    topRight.setY(bottomRight.getY() - y);
                    bottomLeft.setX(anchorX);
                } else {
                    topRight.setY(anchorY);
                    bottomLeft.setX(anchorX);
                }
                break;
            case 'topRight':
                if (fixed) {
                    var y = anchorX * object.getHeight() / object.getWidth();
                    topRight.setY(bottomLeft.getY() - y);
                    topLeft.setY(bottomLeft.getY() - y);
                    bottomRight.setX(anchorX);
                } else {
                    topLeft.setY(anchorY);
                    bottomRight.setX(anchorX);
                }
                break;
            case 'bottomRight':
                if (fixed) {
                    var y = anchorX * object.getHeight() / object.getWidth();
                    bottomRight.setY(y);
                    bottomLeft.setY(y);
                    topRight.setX(anchorX);
                } else {
                    bottomLeft.setY(anchorY);
                    topRight.setX(anchorX);
                }
                break;
            case 'bottomLeft':
                if (fixed) {
                    var x = topRight.getX() - anchorX;
                    var y = x * object.getHeight() / object.getWidth();
                    bottomLeft.setY(topRight.getY() + y);
                    bottomRight.setY(topRight.getY() + y);
                    topLeft.setX(anchorX);
                } else {
                    bottomRight.setY(anchorY);
                    topLeft.setX(anchorX);
                }
                break;
        }

        var width = topRight.getAbsolutePosition().x - topLeft.getAbsolutePosition().x;
        var height = bottomLeft.getAbsolutePosition().y - topLeft.getAbsolutePosition().y;
        group.setSize(width, height);
        object.setSize(width, height);

        if (this.isAnimation()) {
            var scale = webvfxEditor.get('scale');
            var image = object.getImage();
            var x = width / (image.width / this.get('frames'));
            var y = height / image.height;
            object.setScale(x, y);
        }

        var pos = topLeft.getAbsolutePosition();
        this.setPosition(
            pos.x / webvfxEditor.get('scale'),
            pos.y / webvfxEditor.get('scale')
        );

    },

    remove: function() {
        var model = webvfxEditor.get('liveCollection').findWhere({element_id: this.id});
        if(model) {
            model.destroy();
        }
    },

    destroy: function() {
        console.log('destroy', this.id);
        if (this.widget) {
            this.widget.remove();
            this.widget = null;
        }
        if (webvfxEditor.get('realTimeEdition')) {
            this.remove();
        }
        this.kObj.destroy();
        webvfxEditor.objects.remove(this.id);
        webvfxEditor.draw();
    },

    sendLive: function(item) {
        var model = webvfxEditor.get('liveCollection').findWhere({element_id: this.id});
        if(model) {
            model.set(item);
            model.save();
        } else {
            var new_model = new Sketch.Live(item);
            webvfxEditor.get('liveCollection').add(new_model);
            new_model.save();
        }
    }

});

window.WebvfxImage = WebvfxBase.extend({

    initialize: function() {
        WebvfxImage.__super__.initialize.apply(this, arguments);
        var args = arguments[0];
        this.kObj = this.createImage(args);
        var pos = this.getInitialPosition(args);
        this.setPosition(pos.x, pos.y);
        this.createEvents();
        webvfxEditor.add(this.kObj);
        webvfxEditor.draw();
        this.created = true;
    },

    createImage: function(args) {
        this.set('name', args.name);
        var kImage = new Kinetic.Image(this.toJSON());
        this.set('width', kImage.getWidth());
        this.set('height', kImage.getHeight());

        var realWidth = this.get('width') * webvfxEditor.get('scale');
        var realHeight = this.get('height') * webvfxEditor.get('scale');

        kImage.setSize(realWidth, realHeight);

        var group = new Kinetic.Group({
            width: realWidth,
            height: realHeight,
            draggable: true
        });

        group.on('mouseover', function() {
            this.get('Circle').each(function(circle) {
                circle.show();
            });
            webvfxEditor.draw();
        });

        group.on('mouseout', function() {
            this.get('Circle').each(function(circle) {
                circle.hide();
            });
            webvfxEditor.draw();
        });

        group.add(kImage);
        this.addAnchor(group, 0, 0, 'topLeft');
        this.addAnchor(group, realWidth, 0, 'topRight');
        this.addAnchor(group, realWidth, realHeight, 'bottomRight');
        this.addAnchor(group, 0, realHeight, 'bottomLeft');
        return group;
    },

    getName: function() {
        return this.get('name');
    },

    getType: function() {
        return 'image';
    },

    getImageSrc: function() {
        return webvfxEditor.get('server') + 'uploads/' + this.get('name');
    },

    getThumbSize: function() {
        var width = 80;
        var height = this.getHeight() * width / this.getWidth();

        return {
            width: width,
            height: height,
            thumbWidth: width,
            thumbHeight: height
        };
    },

    getView: function() {
        return new WebvfxImageView({model: this});
    },

    getInfo: function() {
        return {
            type: this.getType(),
            width: this.getWidth(),
            height: this.getHeight(),
            top: this.getTop(),
            left: this.getLeft(),
            right: this.getRight(),
            bottom: this.getBottom(),
        }
    },

    getDataToStore: function() {
        return {
            zindex: this.zindex,
            type: this.getType(),
            name: this.getName(),
            left: this.getLeft(),
            top: this.getTop(),
            width: this.getWidth(),
            height: this.getHeight(),
        }
    },

    setWidth: function(width) {
        this.set('width', width);
        this.set('right', webvfxEditor.get('width') - width - this.get('left'));
        var realWidth = width * webvfxEditor.get('scale');
        this.getImage().setWidth(realWidth);
        this.kObj.setWidth(realWidth);
        var leftX = this.kObj.get('.topLeft')[0].getX();
        this.kObj.get('.topRight')[0].setX(leftX + realWidth);
        this.kObj.get('.bottomRight')[0].setX(leftX + realWidth);
        this.draw();
    },

    setHeight: function(height) {
        this.set('height', height);
        this.set('bottom', webvfxEditor.get('height') - height - this.get('top'));
        var realHeight = height * webvfxEditor.get('scale');
        this.getImage().setHeight(realHeight);
        this.kObj.setHeight(realHeight);
        var topY = this.kObj.get('.topLeft')[0].getY();
        this.kObj.get('.bottomLeft')[0].setY(topY + realHeight);
        this.kObj.get('.bottomRight')[0].setY(topY + realHeight);
        this.draw();
    },

    send: function() {
        var full_url = webvfxEditor.get('server') + 'uploads/' + this.getName();
        var image = {
            element_id: this.id,
            type: 'image',
            name: this.getName(),
            src: full_url,
            images: this.getName(),
            zindex: this.zindex,
            width: this.getWidth() + 'px',
            height: this.getHeight() + 'px',
            top: this.getTop() + 'px',
            left: this.getLeft() + 'px',
            right: this.getRight() + 'px',
            bottom: this.getBottom() + 'px',
        };
        this.sendLive(image);
    },

});

window.WebvfxWidget = WebvfxBase.extend({

    initialize: function() {
        WebvfxWidget.__super__.initialize.apply(this, arguments);
        this.setOptions(arguments[0]);
        this.count = 0;
        this.initialized = false;
        this.kObj = this.createWidget();
        this.createEvents();
        webvfxEditor.add(this.kObj);
    },

    setOptions: function(args) {
        var self = this;
        var values = Tools.getIntValues(args.style, ['width', 'height', 'top', 'left']);
        for (key in values) {
            self.set(key, values[key]);
            delete args.style[key];
        }
        var pos = this.getInitialPosition(values);
        this.set('left', pos.x);
        this.set('top', pos.y);
        this.options = args;
        this.options.woeid = appCollection.models[0].get('Common').Widgets.WeatherWoeid;
    },

    createWidget: function() {
        var kImage = new Kinetic.Image();

        var group = new Kinetic.Group({
            draggable: true
        });

        group.on('mouseover', function() {
            this.get('Circle').each(function(circle) {
                circle.show();
            });
            webvfxEditor.draw();
        });

        group.on('mouseout', function() {
            this.get('Circle').each(function(circle) {
                circle.hide();
            });
            webvfxEditor.draw();
        });

        group.add(kImage);
        this.addAnchor(group, 0, 0, 'topLeft');
        this.addAnchor(group, 0, 0, 'topRight');
        this.addAnchor(group, 0, 0, 'bottomRight');
        this.addAnchor(group, 0, 0, 'bottomLeft');

        this.create(this.options);

        return group;
    },

    create: function(options) {
        this.created = false;

        var self = this;
        var DOMURL = window.URL || window.webkitURL || window;

        this.options = $.extend(true, this.options, {
            id: self.cid + '-' + self.count++,
            style: {
                width: self.get('width') + 'px',
                height: self.get('height') + 'px',
                top: self.get('top') + 'px',
                left: self.get('left') + 'px',
                'line-height': self.get('height') + 'px',
            }
        }, options);

        this.options.success = function(widget) {
            if (self.locked) {
                return;
            }

            widget.hide();

            var text = widget.getText();
            if (widget.options.animation == 'marquee') {
                text =
                   "<div xmlns='http://www.w3.org/1999/xhtml' " +
                     "style='position:absolute;white-space:nowrap;left:" +
                     widget.count + "px'>" + text  +
                   "</div>";
            }

            var style = Tools.toCssStyleString(widget.options.style, ['top', 'left', 'right', 'bottom']);

            var font = ('font-family' in widget.options.style)
                     ? WebvfxSimpleWidgetFonts.getFont(widget.options.style['font-family'])
                     : "";

            var svg =
                "<svg xmlns='http://www.w3.org/2000/svg' " +
                "width='" + widget.options.style.width + "' height='" + widget.options.style.height + "'>" +
                 "<foreignObject width='100%' height='100%'>" +
                   font +
                   "<div xmlns='http://www.w3.org/1999/xhtml' style='" + style + "'>" +
                      text +
                   "</div>" +
                 "</foreignObject>" +
                "</svg>";

            var image = new Image();
            image.onload = function() {
                self.getImage().setImage(this);

                var size = Tools.getIntValues(self.options.style, ['width', 'height']);
                self.setSize(size.width, size.height);

                if (!self.initialized) {
                    self.setPosition(self.get('left'), self.get('top'));
                    self.initialized = true;
                }
                webvfxEditor.draw();

                if (!self.created) {
                    self.showInfo();
                    if (webvfxEditor.get('realTimeEdition')) {
                        self.send();
                    }
                    self.created = true;
                }
                DOMURL.revokeObjectURL(this.url);
            };

            var data = new Blob([svg], {type: "image/svg+xml;charset=utf-8"})
            image.src = webkitURL.createObjectURL(data);
        };

        this.widget = new WebvfxSimpleWidget(this.options);
    },

    reload: function(options) {
        if (this.widget != null) {
            this.widget.remove();
            this.widget = null;
        }
        this.create(options);
    },

    getName: function() {
        return 'widget ' + this.options.type;
    },

    getType: function() {
        return this.options.type;
    },

    getText: function() {
        return this.options.text;
    },

    getStyle: function() {
        var exclude = ['width', 'height', 'top', 'left', 'bottom', 'right'];
        return Tools.toCssStyleString(this.options.style, exclude);
    },

    getColor: function() {
        if ('color' in this.options.style) {
            return this.options.style.color;
        }
    },

    getInterval: function() {
        return this.options.interval;
    },

    getFontSize: function() {
        if ('font-size' in this.options.style) {
            return parseInt(this.options.style['font-size'].replace('px', ''));
        }
    },

    getInfo: function() {
        return {
            type: this.getType(),
            width: this.getWidth(),
            height: this.getHeight(),
            top: this.getTop(),
            left: this.getLeft(),
            right: this.getRight(),
            bottom: this.getBottom(),
            color: this.getColor(),
            'font-size': this.getFontSize(),
        }
    },

    getDataToStore: function() {
        var self = this;
        return {
            zindex: this.zindex,
            type: this.options.type,
            text: this.options.text,
            interval: this.options.interval,
            animation: this.options.animation,
            style: $.extend({}, this.options.style, {
                width: self.getWidth() + 'px',
                height: self.getHeight() + 'px',
                top: self.getTop() + 'px',
                left: self.getLeft() + 'px',
            }),
        }
    },

    getView: function() {
        return new WebvfxWidgetView({model: this});
    },

    setText: function(text) {
        this.reload({text: text});
    },

    setWidth: function(width) {
        this.set('width', width);
        this.reload();
    },

    setHeight: function(height) {
        this.set('height', height);
        this.reload();
    },

    send: function() {
        var self = this;
        var widget = {
            element_id: this.id,
            zindex: this.zindex,
            type: 'widget',
            options: {
                id: this.id,
                type: this.options.type,
                text: this.options.text,
                interval: this.options.interval,
                animation: this.options.animation,
                woeid: appCollection.models[0].get('Common').Widgets.WeatherWoeid,
                style: $.extend({}, this.options.style, {
                    width: self.getWidth() + 'px',
                    height: self.getHeight() + 'px',
                    top: self.getTop() + 'px',
                    left: self.getLeft() + 'px',
                }),
            },
        };
        this.sendLive(widget);
    }
});

window.WebvfxAnimation = WebvfxBase.extend({

    initialize: function() {
        WebvfxAnimation.__super__.initialize.apply(this, arguments);
        var args = arguments[0];
        this.kObj = this.createAnimation(args);
        var pos = this.getInitialPosition(args);
        this.setPosition(pos.x, pos.y);
        this.createEvents();
        webvfxEditor.add(this.kObj);
        webvfxEditor.draw();
        this.kObj.children[0].start();
        this.created = true;
    },

    createAnimation: function(args) {
        this.set('name', args.name);
        this.set('frames', args.frames);
        this.set('width', (args.width ? args.width : args.image.width / args.frames));
        this.set('height', (args.height ? args.height : args.image.height));

        var realWidth = this.get('width') * webvfxEditor.get('scale');
        var realHeight = this.get('height') * webvfxEditor.get('scale');

        var animations = {animation: []};

        for (var i = 0; i < args.frames; i++) {
            animations.animation.push({
                x: (args.image.width / args.frames) * i,
                y: 0,
                width: (args.image.width / args.frames),
                height: args.image.height,
            })
        }

        var sprite = new Kinetic.Sprite({
            x: 0,
            y: 0,
            width: realWidth,
            height: realHeight,
            image: args.image,
            animation: 'animation',
            animations: animations,
            frameRate: appCollection.models[0].get('Mosto').General.fps,
        })
        sprite.setScale(
            realWidth / (sprite.getImage().width / this.get('frames')),
            realHeight / sprite.getImage().height
        );

        var group = new Kinetic.Group({
            width: realWidth,
            height: realHeight,
            draggable: true
        });

        group.on('mouseover', function() {
            this.get('Circle').each(function(circle) {
                circle.show();
            });
            webvfxEditor.draw();
        });

        group.on('mouseout', function() {
            this.get('Circle').each(function(circle) {
                circle.hide();
            });
            webvfxEditor.draw();
        });

        group.add(sprite);
        this.addAnchor(group, 0, 0, 'topLeft');
        this.addAnchor(group, realWidth, 0, 'topRight');
        this.addAnchor(group, realWidth, realHeight, 'bottomRight');
        this.addAnchor(group, 0, realHeight, 'bottomLeft');
        return group;
    },

    getName: function() {
        return this.get('name');
    },

    getType: function() {
        return 'animation';
    },

    getImageSrc: function() {
        return webvfxEditor.get('server') + 'uploads/' + this.get('name');
    },

    getThumbSize: function() {
        var thumbWidth = 150;
        var thumbHeight = 50;
        var width = (this.getWidth() * this.get('frames')) * thumbHeight / this.getHeight();

        return {
            width: width,
            height: thumbHeight,
            thumbWidth: thumbWidth,
            thumbHeight: thumbHeight
        };
    },

    getView: function() {
        return new WebvfxAnimationView({model: this});
    },

    getInfo: function() {
        return {
            type: this.getType(),
            width: this.getWidth(),
            height: this.getHeight(),
            top: this.getTop(),
            left: this.getLeft(),
            right: this.getRight(),
            bottom: this.getBottom(),
        }
    },

    getDataToStore: function() {
        return {
            zindex: this.zindex,
            type: this.getType(),
            name: this.getName(),
            frames: this.get('frames'),
            left: this.getLeft(),
            top: this.getTop(),
            width: this.getWidth(),
            height: this.getHeight(),
        }
    },

    setWidth: function(width) {
        this.set('width', width);
        this.set('right', webvfxEditor.get('width') - width - this.get('left'));
        var realWidth = width * webvfxEditor.get('scale');
        var sprite = this.getImage();
        var x = realWidth / (sprite.getImage().width / this.get('frames'));
        sprite.setScale(x, sprite.getScaleY());
        this.kObj.setWidth(realWidth);
        var leftX = this.kObj.get('.topLeft')[0].getX();
        this.kObj.get('.topRight')[0].setX(leftX + realWidth);
        this.kObj.get('.bottomRight')[0].setX(leftX + realWidth);
        this.draw();
    },

    setHeight: function(height) {
        this.set('height', height);
        this.set('bottom', webvfxEditor.get('height') - height - this.get('top'));
        var realHeight = height * webvfxEditor.get('scale');
        var sprite = this.getImage();
        var y = realHeight / sprite.getImage().height;
        sprite.setScale(sprite.getScaleX(), y);
        this.kObj.setHeight(realHeight);
        var topY = this.kObj.get('.topLeft')[0].getY();
        this.kObj.get('.bottomLeft')[0].setY(topY + realHeight);
        this.kObj.get('.bottomRight')[0].setY(topY + realHeight);
        this.draw();
    },

    send: function() {
        var full_url = webvfxEditor.get('server') + 'uploads/' + this.getName();
        var animation = {
            element_id: this.id,
            type: 'animation',
            options: {
                id: this.id,
                zindex: this.zindex,
                name: this.getName(),
                image: full_url,
                frames: this.get('frames'),
                frameRate: appCollection.models[0].get('Mosto').General.fps,
                width: this.getWidth(),
                height: this.getHeight(),
                top: this.getTop(),
                left: this.getLeft(),
            }
        };
        this.sendLive(animation);
    },

});

window.WebvfxCollection = Backbone.Collection.extend({

    initialize: function() {
        this.bind('add', this.onModelAdded, this);
    },

    comparator: function(model) {
        if (model.zindex == -1) {
            model.zindex = this.models.length; // new object
        }
        model.kObj.setZIndex(model.zindex);
        return model.zindex;
    },

    onModelAdded: function(model) {
        if ((model.isImage() || model.isAnimation()) && webvfxEditor.get('realTimeEdition')) {
            model.send();
        }
    },

    sendAll: function() {
        this.each(function(model) {
            model.send();
        });
    },

    destroyAll: function() {
        var models = [];
        this.each(function(model) {
            models.push(model);
        });
        models.forEach(function(model) {
            model.destroy();
        });
    },

});
