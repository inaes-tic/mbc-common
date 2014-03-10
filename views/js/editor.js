window.WebvfxBaseView = Backbone.View.extend({
    tagName: 'div',
    className: 'webvfx-obj',
    collectionEl: 'webvfx-collection',

    events: {
        drop: 'drop'
    },

    elements: [],

    initialize: function() {
        this.render();
    },

    render: function() {
        $(this.el).html(template.objects({
            id: this.model.id,
            model: this.model,
        }));

        if (this.elements.indexOf(this.model.id) < 0) {
            this.elements.push(this.model.id);
            this.addCommonEvents(this.model);
            this.addEvents(this.model);
        }
    },

    drop: function(event, index) {
        this.model.kObj.setZIndex(index);
        webvfxEditor.draw();
        this.$el.trigger('updateSort', [this.model, index]);
    },

    $: function(name, id) {
        return $(this.selector(name, id));
    },

    selector: function(name, id) {
        return '#' + name + '-' + id;
    },

    addCommonEvents: function(model) {
        var id = model.id;
        var el = $('#' + this.collectionEl);
        var self = this;

        var title = this.selector('title', id);

        el.on('click', title , function() {
            var selfId = self.$('webvfx-obj-properties', id).attr('id');
            $('.webvfx-obj-properties').each(function() {
                if ($(this).attr('id') == selfId) {
                    $(this).toggle();
                } else {
                    $(this).hide();
                }
            });
        });

        el.on('mouseover', title, function() {
            document.body.style.cursor = 'pointer';
        });

        el.on('mouseout', title, function() {
            document.body.style.cursor = 'default';
        });

        el.on('keyup', this.selector('width', id), function(e) {
            if (e.keyCode == 13) {
                model.setWidth($(this).val());
                self.$('right', id).val(model.getRight());
            }
        });

        el.on('keyup', this.selector('height', id), function(e) {
            if (e.keyCode == 13) {
                model.setHeight($(this).val());
                self.$('bottom', id).val(model.getBottom());
            }
        });

        el.on('keyup', this.selector('top', id), function(e) {
            if (e.keyCode == 13) {
                model.setTop($(this).val());
                self.$('bottom', id).val(model.getBottom());
            }
        });

        el.on('keyup', this.selector('left', id), function(e) {
            if (e.keyCode == 13) {
                model.setLeft($(this).val());
                self.$('right', id).val(model.getRight());
            }
        });

        el.on('keyup', this.selector('right', id), function(e) {
            if (e.keyCode == 13) {
                model.setRight($(this).val());
                self.$('left', id).val(model.getLeft());
            }
        });

        el.on('keyup', this.selector('bottom', id), function(e) {
            if (e.keyCode == 13) {
                model.setBottom($(this).val());
                self.$('top', id).val(model.getTop());
            }
        });

        el.on('click', this.selector('remove', id), function() {
            model.destroy();
        });
    },
});

window.WebvfxImageView = WebvfxBaseView.extend({
    addEvents: function(model) {
    },
});

window.WebvfxWidgetView = WebvfxBaseView.extend({
    addEvents: function(model) {
        var id = model.id;
        var el = $('#' + this.collectionEl);
        var self = this;

        el.on('keyup', this.selector('text', id), function(e) {
            model.reload({text: $(this).val()});
        });

        el.on('change', this.selector('animation', id), function() {
            model.reload({animation: $(this).val()});
        });

        el.on('keyup', this.selector('interval', id), function(e) {
            if (e.keyCode == 13) {
                model.reload({interval: $(this).val()});
            }
        });

        el.on('keyup', this.selector('font-size', id), function(e) {
            if (e.keyCode == 13) {
                model.reload({style: { 'font-size': $(this).val() + 'px' }});
            }
        });

        el.on('change', this.selector('color', id), function(e) {
            model.reload({style: { 'color': $(this).val() }});
        });

        el.on('change', this.selector('border-color', id), function(e) {
            model.reload({style: { 'border-color': $(this).val() }});
        });

        el.on('change', this.selector('style', id), function() {
            var name = $(this).val();
            if (name) {
                var style = $.extend({}, WebvfxSimpleWidgetStyles[name]);
                if ('font-size' in style) {
                    delete style['font-size'];
                }
                model.reload({ style: style });
            }
        });
    },
});

window.WebvfxAnimationView = WebvfxBaseView.extend({
    addEvents: function(model) {
    },
});

window.WebvfxCollectionView = Backbone.View.extend({
    el: $('#webvfx-collection'),

    tagName: 'div',

    events: {
        updateSort: 'updateSort'
    },

    initialize: function(collection) {
        this.collection.bind('add remove', this.render, this);
        this.render();
    },

    updateSort: function(event, model, index) {
        this.collection.remove(model);
        this.collection.add(model, {at: index});
        var count = 0;
        this.collection.each(function(model) {
            model.zindex = count++;
        });
        if (webvfxEditor.get('realTimeEdition')) {
            this.collection.sendAll();
        }
    },

    render: function() {
        this.$el.empty();
        if (this.collection.length) {
            this.collection.each(function(webvfxObj) {
                var webvfxView = webvfxObj.getView();
                this.$el.prepend(webvfxView.el);
            }, this);
        } else {
            var empty = i18n.gettext('No objects');
            this.$el.prepend($('<h3/>').text(empty));
        }

        // Show data for the last added object
        if (this.collection.new) {
            this.collection.new = false;
            var lastId = this.collection.models[this.collection.length -1].id
            $('#webvfx-obj-properties-' + lastId).show();
        }
    }
});

window.EditorView = Backbone.View.extend({
    el: $('#content'),

    events: {
        "click .colapse"        : "colapse",
        "click #save-sketch"    : "saveSketch",
        "click #load-sketch"    : "loadSketch",
        "click #del-sketch"     : "delSketch",
        "click #new-sketch"     : "newSketch",
        "click #safe-area"      : "safeArea",
        "click #video-preview"  : "videoPreview",
        "click #real-time-edition" : "realTimeEdition",
        "click #update-video"   : "updateVideo",
        "click #clear-video"    : "clearVideo",
        "click #clear-all"      : "clearAll",
        "dragover #container"   : "dragOver",
        "dragleave #container"  : "dragLeave",
        "drop #container"       : "drop",
        "change #files"         : "filesChange",
        "change #resolutions"   : "changeResolution",
        "change #objects"       : "addObject",
        "change #images"        : "addObjectFromImage",
    },
    initialize: function() {
        var config = appCollection.models[0].get('Webvfx').Editor;
        this.options = {
            width: config.width,
            height: config.height,
            scale: config.scale,
            server: config.server,
            realTimeEdition: config.realTimeEdition,
            showSafeArea: config.showSafeArea,
            videoPreview: config.videoPreview,
        };
        var debounce_resize = _.debounce( _.bind(this.render, this), 300);
        $(window).on('resize', debounce_resize);
        this.render();
    },
    render: function() {
        var self = this;
        if (window.webvfxEditor != undefined) {
            this.options.realTimeEdition = webvfxEditor.get('realTimeEdition');
            this.options.showSafeArea = webvfxEditor.get('showSafeArea');
            this.options.videoPreview = webvfxEditor.get('videoPreview');
        }
        $(this.el).html(template.editor(this.options));

        if (this.webvfxCollection == undefined) {
            this.webvfxCollection = new WebvfxCollection();
            this.sketchs = new Sketch.Collection();
            this.schedules = new Sketch.ScheduleCollection();
            this.sketchs.fetch({ success: function() {
                    self.getSketchs();
                    self.schedules.fetch( { success: function() {
                            self.getSchedules();
                            self.schedules.on("remove", function(model) {
                                $('#schedules option').filter(
                                    function() {
                                        return $(this).html() == self.schedToString(model);
                                    }
                                ).remove();
                            });
                        }
                    });
                }
            });
        }

        this.webvfxCollectionView = new WebvfxCollectionView({
            collection: this.webvfxCollection,
            el: $("#webvfx-collection", self.$el)
        });

        $(document).ready(function() {
            self.options.scale = self.autoScale();
            if (window.webvfxEditor != undefined) {
                self.options.layer = webvfxEditor.getLayer();
            }
            window.webvfxEditor = new WebvfxEditor(self.options);
            webvfxEditor.objects = self.webvfxCollection;
            webvfxEditor.objects.each(function(o) {
                o.setSize(o.get('width'), o.get('height'));
            });
            webvfxEditor.draw();
            self.makeSortable();
            self.updateCss();
            self.updateVideoStream();
            self.updateStatusBar();
            self.updateImagesList();
            if (webvfxEditor.get('showSafeArea')) {
                self.createSafeArea();
                self.safeArea();
            }
            if (webvfxEditor.get('videoPreview')) {
                self.videoPreview();
            }
            if (webvfxEditor.get('liveCollection')) {
                var liveCollection = webvfxEditor.get('liveCollection');
                liveCollection.fetch({success: function(col) {
                    liveCollection.on("add", function(model) {
                        if (model.get('origin') === 'server')
                            self.loadWidget(model.toJSON());
                    });
                    liveCollection.on("remove", function(model, col, opts) {
                        if (!opts.ignore)
                            self.unloadWidget(model);
                    });
                    col.forEach(function(widget){
                        self.loadWidget(widget.toJSON());
                    });
                }});
            }
        });
    },
    colapse:function(ev) {
        $(ev.target).parent().children('.content').toggle();
    },
    autoScale: function () {
        var widthScale = $("#video-container").width() / this.options.width;
        var heightScale = $("#video-container").height() / this.options.height;
        return ((widthScale > heightScale) ? heightScale : widthScale).toFixed(2);
    },
    saveSketch: function () {
        var self = this;

        var key = $('#sketchs').val();
        var objects = [];
        this.webvfxCollection.each(function(e) {
            objects.push(e.getDataToStore());
        });

        if (key == '[select]') {
            var description = i18n.gettext('New Sketch name:')
            this.prompt(
                description,
                function (new_key) {
                    if(new_key) {
                        self.sketchs.create({ name: new_key, data: objects }, {success: function() {
                            console.log('Success creating sketch: '+ new_key);
                        }});
                        var opt_key = '<option value="' + new_key + '">';
                        $('#sketchs').append($(opt_key).html(new_key).prop('selected', true));
                    } else {
                        var description = i18n.gettext('You must enter a new sketch name to save it');
                        self.alert(description);
                    }
                },
                function() {
                    return;
                }
            );

        } else {
            var keyExists = _.contains(this.sketchs.pluck('name'), key);
            if(keyExists) {
                var description = i18n.translate('Overwrite sketch %s').fetch(key);
                this.confirm(description,
                    function () {
                        var model = self.sketchs.findWhere({name: key});
                        if (model) {
                            model.set({name: key, data: objects});
                            model.save();
                            console.log('sketch "' + key + '" saved');
                        } else {
                            console.log('tried to save: "' + key + '"but not found in sketchs');
                        }
                    },
                    function() {
                        var description = i18n.gettext('Must select a new name');
                        self.alert(description);
                    }
                );
            }
        }
    },
    loadSketch: function() {
        var self = this;
        var key = $('#sketchs').val();
        if (key == '[select]') {
            var description = i18n.gettext('You must select a sketch to load');
            this.alert(description);
            return;
        }
        this.webvfxCollection.destroyAll();

        _.each(this.sketchs.findWhere({name: key}).get('data'), function(s) {
            self.loadWidget(s);
        });

        console.log('sketch "' + key + '" loaded');
    },
    delSketch: function () {
        var key = $('#sketchs').val();
        if (key == '[select]') {
            var description = i18n.gettext('You must select a sketch to delete');
            this.alert(description);
            return;
        }

        var self = this;
        var description = i18n.translate('Do you want to delete the sketch "%s" ?').fetch(key);
        this.confirm(
            description,
            function () {
                var model = self.sketchs.findWhere({ name: key });
                if (model) {
                    model.destroy();
                    $('#sketchs option').filter(
                        function() {
                            return $(this).html() == key;
                        }
                    ).remove();
                    console.log('sketch "' + key + '" deleted');
                } else {
                    console.log('tried to delete: "' + key + '" but not found in sketchs');
                }
            },
            function () {
                console.log('Not deleting sketch "' + key + '"');
            }
        );
    },
    newSketch: function() {
        this.clearAll();
        var key = $('#sketchs').val('[select]');
    },
    getSketchs: function () {
        var keys = this.sketchs.pluck('name');
        _.each(keys, function(k) {
            var selector = "#sketchs option[value='" + k + "']";
            var exist_key = $(selector).length;
            if (!exist_key) {
                var opt = '<option value="' + k + '">';
                $('#sketchs').append($(opt).html(k));
            }
        });
    },
    getSchedules: function () {
        var self = this;
        this.schedules.forEach(function(sched) {
            var k = self.schedToString(sched);
            var selector = "#schedules option[value='" + k + "']";
            var exist_key = $(selector).length;
            if (!exist_key) {
                var opt = '<option value="' + k + '">';
                $('#schedules').append($(opt).html(k));
            }
        });
    },
    schedToString: function(sched) {
        var sketch = this.sketchs.findWhere({_id: sched.get('sketch_id')});
        var seconds = 'infinite';
        if (sched.get('length') && sched.get('length') !== 0)
            seconds = sched.get('length') / 1000 + " sec";
        var k = moment(sched.get('date')).format("DD/MM/YYYY HH:mm:ss") + " | " + seconds + " | " + sketch.get('name');
        return k;
    },
    loadWidget: function(widget) {
        var self = this;
        if (widget.type == 'image' || widget.type == 'animation') {
            widget.image = new Image();
            widget.image.onload = function() {
                self.webvfxCollection.add(
                    self.createObjectFactory(widget.type, widget)
                );
            };
            widget.image.src = self.options.server + 'uploads/' + widget.name;
        } else {
            self.webvfxCollection.add(new WebvfxWidget(widget));
        }
    },
    unloadWidget: function(model) {
        var widget = this.webvfxCollection.findWhere({element_id: model.get('element_id')});
        if (widget)
            widget.destroy();
    },
    safeArea: function() {
        if (this.safeAreaLayer === undefined) {
            console.log('creating safe area');
            this.createSafeArea();
        }
        if ($("#safe-area").is(':checked')) {
            console.log('showing safe area');
            webvfxEditor.set('showSafeArea', true);
            this.safeAreaLayer.show();
            this.safeAreaLayer.draw();
        } else {
            console.log('hiding safe area');
            webvfxEditor.set('showSafeArea', false);
            this.safeAreaLayer.hide();
        }
    },
    createSafeArea: function() {
        this.safeAreaLayer = new Kinetic.Layer();

        var invisibleWidth = Math.round(1920 * webvfxEditor.get('scale'));
        var invisibleHeight = Math.round(1080 * webvfxEditor.get('scale'));

        var invisibleArea = this.getArea(
            invisibleWidth,
            invisibleHeight,
            webvfxEditor.get('actionSafe').width,
            webvfxEditor.get('actionSafe').height,
            '#333'
        );

        var actionSafeArea = this.getArea(
            webvfxEditor.get('actionSafe').width,
            webvfxEditor.get('actionSafe').height,
            webvfxEditor.get('titleSafe').width,
            webvfxEditor.get('titleSafe').height,
            '#888'
        );

        invisibleArea.setX((webvfxEditor.getScaledWidth() - invisibleWidth) / 2);
        invisibleArea.setY((webvfxEditor.getScaledHeight() - invisibleHeight) / 2);

        actionSafeArea.setX((webvfxEditor.getScaledWidth() - webvfxEditor.get('actionSafe').width) / 2);
        actionSafeArea.setY((webvfxEditor.getScaledHeight() - webvfxEditor.get('actionSafe').height) / 2);

        this.safeAreaLayer.add(actionSafeArea);
        this.safeAreaLayer.add(invisibleArea);
        this.safeAreaLayer.hide();
        this.safeAreaLayer.setListening(false);
        webvfxEditor.get('stage').add(this.safeAreaLayer);
    },
    getArea : function(outWidth, outHeight, inWidth, inHeight, color) {
        var base = new Kinetic.Rect({
            fill: color,
        });

        var top = base.clone({
            width: outWidth,
            height: (outHeight - inHeight) / 2,
            x: 0,
            y: 0
        });

        var bottom = top.clone({
            y: inHeight + ((outHeight - inHeight) / 2)
        });

        var left = base.clone({
            width: (outWidth - inWidth) / 2,
            height: inHeight,
            x: 0,
            y: (outHeight - inHeight) / 2
        });

        var right = left.clone({
            x: inWidth + ((outWidth - inWidth) / 2)
        });

        var area = new Kinetic.Group({
            'opacity': .4
        });
        area.add(top);
        area.add(bottom);
        area.add(left);
        area.add(right);

        return area;
    },
    videoPreview: function() {
        if ($("#video-preview").is(':checked')) {
            console.log('showing video preview');
            webvfxEditor.set('videoPreview', true);
            $('#container').removeClass('container-background');
            $(video).show();
        } else {
            console.log('hiding video preview');
            webvfxEditor.set('videoPreview', false);
            $(video).hide();
            $('#container').addClass('container-background');
        }
    },
    realTimeEdition: function () {
        webvfxEditor.set('realTimeEdition', $("#real-time-edition").is(':checked'));
        console.log('real time edition ' + (webvfxEditor.get('realTimeEdition') ? 'on' : 'off'));
    },
    updateVideo:  function () {
        console.log('manual update');
        this.clearVideo();
        this.webvfxCollection.sendAll();
    },
    clearVideo:  function () {
        console.log('manual clear');
        _.each( _.clone(webvfxEditor.get('liveCollection').models), function(model){
            model.destroy();
        });
    },
    clearAll: function() {
        if (this.webvfxCollection.models.length) {
            var self = this;
            var description = i18n.gettext('Clear all objects?');
            this.confirm(description, function () {
                self.webvfxCollection.destroyAll();
                console.log('clear all');
            });
        } else {
            this.alert("Nothing to clear");
        }
    },
    processFiles : function(files) {
        if (files && typeof FileReader !== "undefined") {
            for (var i = 0; i < files.length; i++) {
                this.readFile(files[i]);
            }
        }
    },
    showStartActionMessage: function(message, id) {
        var div = $('<div />').attr('id', id);
        $('#action-messages').append(div);
        div.animate({height: '40px'}, 250, function() {
            $(this).text(message);
        });
    },
    showEndActionMessage: function(message, id) {
        var div = $('#' + id);
        var ms = 250;
        setTimeout(function() {
            div.fadeOut(ms, function() {
                div.text(message).fadeIn(ms, function() {
                    setTimeout(function() {
                        div.fadeOut(ms, function() {
                            div.text("").show().animate({height: '0px'}, ms, function() {
                                div.remove();
                            });
                        });
                    }, ms * 2);
                });
            });
        }, ms * 2);
    },
    readFile : function(file) {
        if( /(image|zip|x-compressed-tar)/i.test(file.type) ) {
            file.id = uuid.v4();
            var message = (/image/i).test(file.type)
                        ? i18n.gettext('Uploading image')
                        : i18n.gettext('Creating animation');
            message += ' ' + file.name + '...';
            this.showStartActionMessage(message, file.id)
            var self = this;
            var reader = new FileReader();
            reader.onload = function(e) {
                self.uploadImage(file, e);
            };
            reader.readAsDataURL(file);
        } else {
            var description = i18n.gettext('File format not supported');
            this.alert(description);
        }
    },
    createObjectFactory: function(type, params) {
        switch (type) {
            case 'image':
                return new WebvfxImage(params)
                break;
            case 'animation':
                return new WebvfxAnimation(params)
                break;
        }
    },
    uploadImage : function(file, e) {
        var self = this;
        var formdata = new FormData();
        formdata.append('uploadedFile', file);
        $.ajax({
            url: self.options.server + 'uploadFile',
            type: 'POST',
            data: formdata,
            processData: false,
            contentType: false,
            success: function(res) {
                image = new Image();
                image.onload = function() {
                    var message = ('error' in res)
                                ? 'Error ' + res.error
                                : 'Done ' + res.type + ' ' + file.name + ' !';
                    self.showEndActionMessage(message, file.id);
                    self.updateImagesList();
                    self.webvfxCollection.new = true;
                    self.webvfxCollection.add(
                        self.createObjectFactory(res.type, {image: this, name: res.filename, frames: res.frames})
                    );
                }
                image.src = self.options.server + 'uploads/' + res.filename;
            }
        });
    },
    dragOver : function() {
        console.log('dragover');
        $("#container").addClass('hover');
        return false;
    },
    dragLeave : function() {
        console.log('dragleave');
        $("container").removeClass('hover');
        return false;
    },
    drop: function(ev) {
        console.log('drop');
        ev.stopPropagation();
        ev.preventDefault();
        $("#container").removeClass('hover');
        var files = ev.originalEvent.dataTransfer.files;
        this.processFiles(files);
        return false;
    },
    filesChange: function (ev) {
        this.processFiles(ev.currentTarget.files);
    },
    makeSortable: function () {
        $("#webvfx-collection").sortable({
            cursor: 'move',
            stop: function(event, ui) {
                var total = $('.webvfx-obj').length - 1;
                var index = ui.item.index();
                ui.item.trigger('drop', total - index);
            }
        });
        //$("#webvfx-collection").disableSelection();
    },
    updateCss: function () {
        $('#container').css({
            width: webvfxEditor.getScaledWidth() + 'px',
            height: webvfxEditor.getScaledHeight() + 'px'
        });

        $('#player-container').css({
            width: webvfxEditor.getScaledWidth() + 'px',
            height: webvfxEditor.getScaledHeight() + 'px'
        });
    },
    updateVideoStream: function() {
        window.video = $('#player').get(0);
        video.width = webvfxEditor.getScaledWidth();
        video.height = webvfxEditor.getScaledHeight();
    },
    updateStatusBar: function() {
        var getStatusBarInfo = function() {
            var pos = webvfxEditor.get('stage').getMousePosition();

            if (pos === undefined) {
                var mouseX = 0;
                var mouseY = 0;
            } else {
                var mouseX = Math.round(pos.x / webvfxEditor.get('scale'));
                var mouseY = Math.round(pos.y / webvfxEditor.get('scale'));
            }
            return [
                'size: ' + webvfxEditor.get('width') + 'x' + webvfxEditor.get('height') + 'px',
                'scale: ' + webvfxEditor.get('scale'),
                'pointer at (' + mouseX + 'px,' + mouseY + 'px)'
            ].join(', ');
        }

        $('#status-bar').html(getStatusBarInfo());

        $(webvfxEditor.get('stage').getContent()).on('mousemove', function(event) {
            $('#status-bar').html(getStatusBarInfo());
        });
    },
    updateImagesList: function() {
        $.ajax({
            url: this.options.server + 'images',
            dataType: 'json',
            success: function(data) {
                $('#images option:gt(0)').remove();
                var el = $('#images');
                _.each(data.images, function(image) {
                    el.append($('<option/>').text(image));
                });
            },
        });
    },
    changeResolution: function () {
        var self = this;
        var description = i18n.gettext("Are you sure?");
        this.confirm(
            description,
            function () {
                var res = $("#resolutions").val();
                aRes = res.split('x');
                if(aRes.length == 2) {
                    self.options.width = parseInt(aRes[0]);
                    self.options.height = parseInt(aRes[1]);
                    self.render();
                }
            }
        );
    },
    addObject: function() {
        var type = $('#objects').val();

        switch (type) {
            case 'image':
            case 'animation':
                $('#files').click();
                break;

            case 'text':
                this.webvfxCollection.new = true;
                this.webvfxCollection.add(new WebvfxWidget({
                    options: {
                        type: type,
                        text: "",
                        interval: 0,
                        style: $.extend({}, {
                            width: '500px',
                            height: '60px',
                            'line-height': '60px',
                        }, WebvfxSimpleWidgetStyles['fire']),
                    }
                }));
                break;

            case 'box':
                this.webvfxCollection.new = true;
                this.webvfxCollection.add(new WebvfxWidget({
                    options: {
                        type: type,
                        text: "",
                        interval: 0,
                        style: $.extend({}, {
                            width: '300px',
                            height: '30px',
                            'line-height': '30px',
                        }, WebvfxSimpleWidgetStyles['heaven']),
                    }
                }));
                break;

            case 'time':
                this.webvfxCollection.new = true;
                this.webvfxCollection.add(new WebvfxWidget({
                    options: {
                        type: type,
                        text: "%H:%M:%S",
                        interval: 500,
                        style: $.extend({}, {
                            width: '100px',
                            height: '30px',
                            'line-height': '30px',
                        }, WebvfxSimpleWidgetStyles['black']),
                    }
                }));
                break;

            case 'weather':
                this.webvfxCollection.new = true;
                this.webvfxCollection.add(new WebvfxWidget({
                    options: {
                        type: type,
                        text: "%T%Tunit %H%Hunit",
                        interval: 2000,
                        style: $.extend({}, {
                            width: '100px',
                            height: '30px',
                            'line-height': '30px',
                        }, WebvfxSimpleWidgetStyles['gray']),
                    }
                }));
                break;

        }

        $('#objects').val('');
    },
    addObjectFromImage: function() {
        var self = this;
        var filename = $('#images').val();
        var id = uuid.v4();
        this.showStartActionMessage('Loading ' + filename, id);
        $.ajax({
            url: this.options.server + 'images/' + filename,
            dataType: 'json',
            success: function(res) {
                if ('error' in res) {
                    self.showEndActionMessage('Error ' + res.error, id);
                    return;
                }

                image = new Image();
                image.onload = function() {
                    self.showEndActionMessage('Done ' + filename, id);
                    self.webvfxCollection.new = true;
                    self.webvfxCollection.add(
                        self.createObjectFactory(res.type, {image: this, name: filename, frames: res.metadata.frames})
                    );
                }
                image.src = self.options.server + 'uploads/' + filename;
            },
        });
        $('#images').val('');
    },
    alert: function(description) {
        var title = i18n.gettext('Alert');
        var description = description || i18n.gettext('Wait there was a problem');
        $('#modal').html(new ModalAlert({ title: title, description: description }).render().el);
        window.scrollTo(0,0);
    },
    confirm: function(description, yesCallback, noCallback) {
        var yesCallback = yesCallback || function() {return; };
        var noCallback = noCallback || function() { return; };
        var title = i18n.gettext('Confirm');
        var description = description || i18n.gettext('Wait there was a problem');
        $('#modal').html(new ModalConfirm({ title: title, description: description, yesCallback: yesCallback, noCallback: noCallback }).render().el);
        window.scrollTo(0,0);
    },
    prompt: function (description, submitCallback, cancelCallback) {
        var submitCallback = submitCallback || function() {};
        var cancelCallback = cancelCallback || function() {};
        var title = i18n.gettext('Prompt');
        var description = description || i18n.gettext('Wait there was a problem');
        $('#modal').html(new ModalPrompt({ title: title, description: description, submitCallback: submitCallback, cancelCallback: cancelCallback }).render().el);
        window.scrollTo(0,0);
    },
    canNavigateAway: function (options) {
        this.viewCleanup();
        options['ok']();
    },
    viewCleanup: function() {
        this.undelegateEvents();
    },
});

var ModalAlert = Backbone.Modal.extend({
    initialize: function (options) {
        this.options = options || {};
    },
    template: function() {
        var parse_tpl = template.alert(this.options);
        return _.template(parse_tpl);
    },
    cancelEl: '.bbm-button'
});

var ModalConfirm = Backbone.Modal.extend({
     initialize: function (options) {
        this.options = options || {};
    },
    template: function() {
        var parse_tpl = template.confirm(this.options);
        return _.template(parse_tpl);
    },
    cancelEl: '.no',
    submitEl: '.yes',
    events: {
        "click .yes": function() { this.options.yesCallback(); },
        "click .no" : function() { this.options.noCallback();  },
    }
});

var ModalPrompt = Backbone.Modal.extend({
    initialize: function (options) {
        this.options = options || {};
    },
    template: function() {
        var parse_tpl = template.prompt(this.options);
        return _.template(parse_tpl);
    },
    submitEl: '.submit',
    cancelEl: '.cancel',
    events: {
        "click .submit"              : "save",
        "keypress input[id=textkey]" : "saveOnEnter",
        "click .cancel"              : function() { this.options.cancelCallback(); },
    },
    save: function () {
        this.options.submitCallback($('#textkey').val());
    },
    saveOnEnter: function (e) {
        if (e.keyCode != 13) return;
        this.save();
    }
});

var Tools = {
    toCssStyleString: function(obj, exclude) {
        style = "";
        for (i in obj) {
            if ( exclude.indexOf(i) == -1) {
                style += i + ":" + obj[i] + ";";
            }
        }
        return style;
    },

    toCssStyleObject: function(str) {
        var style = {};
        var lines = str.trim().split('\n');
        for (i in lines) {
            var keyValue = lines[i].trim().split(':');
            style[keyValue[0].trim()] = keyValue[1].trim().replace(';', '');
        }
        return style;
    },

    getIntValues: function(style, keys) {
        var values = {};
        keys.forEach(function(key) {
            if (key in style) {
                values[key] = parseInt(style[key].replace('px', ''));
            }
        });
        return values;
    },

    getLineHeight: function(style) {
        var values = this.getIntValues(style, ['height', 'border-width']);
        if ('border-width' in values) {
            return values.height - (values['border-width'] * 2);
        } else {
            return values.height;
        }
    },

};
