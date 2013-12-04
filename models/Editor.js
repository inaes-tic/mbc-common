window.WebvfxEditor = Backbone.Model.extend({

    defaults: {
        width: 0,
        height: 0,
        scale: 1,
        stage: null,
        actionSafe: {
            width: 0,
            height: 0
        },
        titleSafe: {
            width: 0,
            height: 0
        },
        realTimeEdition: false,
        server: '',
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
        this.get('stage').add(new Kinetic.Layer());

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
    },

    getScaledWidth: function() {
        return (this.get('width') * this.get('scale'));
    },

    getScaledHeight: function() {
        return (this.get('height') * this.get('scale'));
    },

});

window.WebvfxBase = Backbone.Model.extend({

    defaults: {
        width: 0,
        height: 0,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        name: '',
        locked: false,
        created: false,
    },

    initialize: function() {
        this.id = this.cid;
        this.layer = webvfxEditor.get('stage').children[0];
    },

    createEvents: function(kObj) {
        var self = this;

        kObj.on('mouseover', function() {
            document.body.style.cursor = 'pointer';
        });

        kObj.on('dragmove', function() {
            self.updatePosition();
            self.showInfo(kObj);
        });

        kObj.on('dragend', function() {
            if (self.created && webvfxEditor.get('realTimeEdition')) {
                webvfxEditor.objects.sendAll();
            }
        });

        kObj.on('mouseout', function() {
            document.body.style.cursor = 'default';
            $('#info').html('');
        });

        kObj.on('mousedown', function() {
            $('.webvfx-obj div').hide();
            $('#webvfx-data-' + kObj.webvfxObj.id).show();
        });
    },

    draw: function() {
        this.layer.draw();
        if (webvfxEditor.get('realTimeEdition')) {
            webvfxEditor.objects.sendAll();
        }
    },

    showInfo: function(kObj) {
        var info = kObj.webvfxObj.getInfo();
        for (key in info) {
            $('#' + key + '-' + kObj.webvfxObj.id).val(info[key]);
        }
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

    getImageSrc: function() {
        if (this.getImage().attrs.image) {
            return this.getImage().attrs.image.src;
        } else {
            return "";
        }
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

    setInitialPosition: function(args) {
        if ('top' in args) {
            this.set('top', args.top);
        } else {
            this.set('top', Math.ceil(
                (webvfxEditor.get('height') - this.get('height')) / 2
            ));
        }
        this.set('bottom', webvfxEditor.get('height') - this.get('top') - this.get('height'));

        if ('left' in args) {
            this.set('left', args.left);
        } else {
            this.set('left', Math.ceil(
                (webvfxEditor.get('width') - this.get('width')) / 2
            ));
        }
        this.set('right', webvfxEditor.get('width') - this.get('left') - this.get('width'));

        var top = Math.ceil(this.get('top') * webvfxEditor.get('scale'));
        var left = Math.ceil(this.get('left') * webvfxEditor.get('scale'));
        this.kObj.setPosition(left, top);
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
            if (self.getType() != 'image') {
                var fontSize = Math.ceil(self.get('height') * self.getFontSize() / self._startHeight);
                self.reload({
                    style: {
                        width: self.get('width') + 'px',
                        height: self.get('height') + 'px',
                        'line-height': self.get('height') + 'px',
                        'font-size': fontSize + 'px',
                    }
                });
            }
        });

        anchor.on('mouseover', function() {
            document.body.style.cursor = 'pointer';
            this.setStrokeWidth(4);
            self.layer.draw();
        });

        anchor.on('mouseout', function() {
            document.body.style.cursor = 'default';
            this.setStrokeWidth(2);
            self.layer.draw();
        });

        group.add(anchor);
    },

    update: function(activeAnchor, fixed) {
        if (fixed) {
            console.log('Shift key pressed!');
        }

        var group = activeAnchor.getParent();
        var image = group.children[0];
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
                    var y = x * image.getHeight() / image.getWidth();
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
                    var y = anchorX * image.getHeight() / image.getWidth();
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
                    var y = anchorX * image.getHeight() / image.getWidth();
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
                    var y = x * image.getHeight() / image.getWidth();
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
        image.setSize(width, height);

        var pos = topLeft.getAbsolutePosition();
        this.setPosition(
            pos.x / webvfxEditor.get('scale'),
            pos.y / webvfxEditor.get('scale')
        );
    },

    remove: function() {
        webvfxClient.remove({elements: this.id});
    },

    destroy: function() {
        console.log('destroy', this.id);
        if (webvfxEditor.get('realTimeEdition')) {
            this.remove();
        }
        this.kObj.destroy();
        webvfxEditor.objects.remove(this.id);
        this.layer.draw();
    },

});

window.WebvfxImage = WebvfxBase.extend({

    initialize: function() {
        WebvfxImage.__super__.initialize.apply(this, arguments);
        var args = arguments[0];

        this.kObj = this.createImage();
        this.kObj.webvfxObj = this;
        this.setInitialPosition(args);
        this.createEvents(this.kObj);
        this.layer.add(this.kObj);
        this.layer.draw();
        this.created = true;
    },

    createImage: function() {
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
            this.getLayer().draw();
        });

        group.on('mouseout', function() {
            this.get('Circle').each(function(circle) {
                circle.hide();
            });
            this.getLayer().draw();
        });

        group.add(kImage);
        this.addAnchor(group, 0, 0, 'topLeft');
        this.addAnchor(group, realWidth, 0, 'topRight');
        this.addAnchor(group, realWidth, realHeight, 'bottomRight');
        this.addAnchor(group, 0, realHeight, 'bottomLeft');
        return group;
    },

    getName: function() {
        return this.getImage().attrs.name;
    },

    getType: function() {
        return 'image';
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
            type: this.getType(),
            name: this.getImage().attrs.name,
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
        var topY = this.kObj.get('.topLeft')[0].getY();
        this.kObj.get('.bottomLeft')[0].setY(topY + realHeight);
        this.kObj.get('.bottomRight')[0].setY(topY + realHeight);
        this.draw();
    },

    send: function() {
        this.remove();
        var kImage = this.getImage();
        webvfxClient.addImage({
            images: kImage.attrs.name,
            name: kImage.attrs.name,
            id: this.id,
            top: this.getTop() + 'px',
            left: this.getLeft() + 'px',
            right: this.getRight() + 'px',
            bottom: this.getBottom() + 'px',
            width: this.getWidth() + 'px',
            height: this.getHeight() + 'px',
        });
    },

});

window.WebvfxWidget = WebvfxBase.extend({

    initialize: function() {
        WebvfxWidget.__super__.initialize.apply(this, arguments);
        this.options = arguments[0];
        this.count = 0;
        this.initialized = false;
        this.kObj = this.createWidget();
        this.kObj.webvfxObj = this;
        this.createEvents(this.kObj);
        this.layer.add(this.kObj);
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
            this.getLayer().draw();
        });

        group.on('mouseout', function() {
            this.get('Circle').each(function(circle) {
                circle.hide();
            });
            this.getLayer().draw();
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
        var self = this;
        this.created = false;

        this.options = $.extend(true, this.options, {
            k: self,
            id: self.cid + '-' + self.count++,
        }, options);

        this.options.success = function(self) {
            if (self.options.k.locked) {
                return;
            }

            if (self.widget.is(':visible')) {
                self.widget.hide();
            }

            var text = self.getText();
            var style = Tools.toCssStyleString(self.options.style, ['top', 'left']);
            if (self.options.animation == 'marquee') {
                var size = Tools.getRealSize(style, '');
                text = 
                   "<div xmlns='http://www.w3.org/1999/xhtml' " +
                     "style='position:absolute;white-space:nowrap;left:" +
                     self.count + "px'>" + text  +
                   "</div>";
            } else {
                var size = Tools.getRealSize(style, text);
            }

            if ('font-family' in self.options.style) {
                font = WebvfxSimpleWidgetFonts.getFont(self.options.style['font-family']);
            } else {
                font = '';
            }

            var svg = 
                "<svg xmlns='http://www.w3.org/2000/svg' " +
                "width='" + size.width + "px' height='" + size.height + "px'>" +
                 "<foreignObject width='100%' height='100%'>" +
                   font +
                   "<div xmlns='http://www.w3.org/1999/xhtml' style='" + style + "'>" +
                      text +
                   "</div>" +
                 "</foreignObject>" +
                "</svg>";

            var DOMURL = window.URL || window.webkitURL || window;
            var data = new Blob([svg], {type: "image/svg+xml;charset=utf-8"})
            var url = webkitURL.createObjectURL(data);
            var img = new Image();
            var k = self.options.k;

            img.onload = function() {
                k.set('width', size.width);
                k.set('height', size.height);
                var realWidth = k.get('width') * webvfxEditor.get('scale');
                var realHeight = k.get('height') * webvfxEditor.get('scale');
                k.getImage().setImage(img);
                k.getImage().setWidth(realWidth);
                k.getImage().setHeight(realHeight);
                k.kObj.setWidth(realWidth);
                k.kObj.setHeight(realHeight);

                if (!k.initialized) {
                    k.kObj.get('.topRight')[0].setX(realWidth);
                    k.kObj.get('.bottomLeft')[0].setY(realHeight);
                    k.kObj.get('.bottomRight')[0].setX(realWidth);
                    k.kObj.get('.bottomRight')[0].setY(realHeight);

                    var args = {};
                    if ('top' in self.options.style) {
                        args.top = self.options.style.top.replace('px', '');
                    }
                    if ('left' in self.options.style) {
                        args.left = self.options.style.left.replace('px', '');
                    }
                    k.setInitialPosition(args);
                    k.initialized = true;
                }
                k.layer.draw();

                if (!k.created) {
                    k.showInfo(k.kObj);
                    if (webvfxEditor.get('realTimeEdition')) {
                        k.send();
                    }
                    k.created = true;
                }

                DOMURL.revokeObjectURL(url);
            };
            img.src = url;
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

    destroy: function() {
        if (webvfxEditor.get('realTimeEdition')) {
            this.remove();
        }
        this.widget.remove();
        this.kObj.destroy();
        webvfxEditor.objects.remove(this.id);
        this.layer.draw();
    },

    getName: function() {
        return this.widget + this.cid;
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
        return {
            type: this.getType(),
            text: this.options.text,
            interval: this.options.interval,
            animation: this.options.animation,
            style: $.extend({}, this.options.style, {
                top: this.getTop() + 'px',
                left: this.getLeft() + 'px',
                width: this.getWidth() + 'px',
                height: this.getHeight() + 'px',
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
        this.set('right', webvfxEditor.get('width') - width - this.get('left'));
        this.reload({style: {width: width + 'px'}});
    },

    setHeight: function(height) {
        this.set('height', height);
        this.set('bottom', webvfxEditor.get('height') - height - this.get('top'));
        this.reload({style: {
            height: height + 'px',
            'line-height': height + 'px',
        }});
    },

    send: function() {
        this.remove();
        webvfxClient.addWidget({
            id: this.id,
            options: {
                id: this.id,
                type: this.options.type,
                text: this.options.text,
                interval: this.options.interval,
                animation: this.options.animation,
                style: $.extend({}, {
                    top: this.getTop(),
                    left: this.getLeft(),
                }, this.options.style),
            }
        });
    },

});

window.WebvfxCollection = Backbone.Collection.extend({

    initialize: function() {
        this.bind('add', this.onModelAdded, this);
    },

    onModelAdded: function(model) {
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

window.webvfxClient = {

    remove: function(data) {
        this.send('remove', data, function(res) {
            console.log('remove object ' + data.elements);
        });
    },

    addImage: function(data) {
        this.send('addImage', data, function(res) {
            console.log('image', data.name, 'added');
        });
    },

    addWidget: function(data) {
        this.send('addWidget', data, function(res) {
            console.log('widget', data.options.type, 'added');
        });
    },

    send: function(url, data, callback) {
        var formdata = new FormData();
        for (var key in data) {
            if (typeof data[key] == 'object') {
                formdata.append(key, JSON.stringify(data[key]));
            } else {
                formdata.append(key, data[key]);
            }
        }
        $.ajax({
            url: webvfxEditor.get('server') + url,
            type: 'POST',
            data: formdata,
            processData: false,
            contentType: false,
            success: callback
        });
    }

};
