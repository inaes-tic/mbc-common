window.WebvfxBaseView = Backbone.View.extend({
    tagName: 'div',
    className: 'webvfx-obj',

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
        this.model.layer.draw();
        this.$el.trigger('updateSort', [this.model, index]);
    },

    $: function(name, id) {
        return $('#' + name + '-' + id);
    },

    addCommonEvents: function(model) {
        var id = model.id;
        var self = this;

        this.$('title', id).live('click', function() {
            var selfId = self.$('webvfx-data', id).attr('id');
            $('.webvfx-obj div').each(function() {
                if ($(this).attr('id') != selfId) {
                    console.debug('hide ' + $(this).attr('id'));
                    $(this).hide();
                }
            });
            self.$('webvfx-data', id).toggle();
        });

        this.$('title', id).live('mouseover', function() {
            document.body.style.cursor = 'pointer';
        });

        this.$('title', id).live('mouseout', function() {
            document.body.style.cursor = 'default';
        });

        this.$('width', id).live('keyup', function(e) {
            if (e.keyCode == 13) {
                model.setWidth($(this).val());
                self.$('right', id).val(model.getRight());
            }
        });

        this.$('height', id).live('keyup', function(e) {
            if (e.keyCode == 13) {
                model.setHeight($(this).val());
                self.$('bottom', id).val(model.getBottom());
            }
        });

        this.$('top', id).live('keyup', function(e) {
            if (e.keyCode == 13) {
                model.setTop($(this).val());
                self.$('bottom', id).val(model.getBottom());
            }
        });

        this.$('left', id).live('keyup', function(e) {
            if (e.keyCode == 13) {
                model.setLeft($(this).val());
                self.$('right', id).val(model.getRight());
            }
        });

        this.$('right', id).live('keyup', function(e) {
            if (e.keyCode == 13) {
                model.setRight($(this).val());
                self.$('left', id).val(model.getLeft());
            }
        });

        this.$('bottom', id).live('keyup', function(e) {
            if (e.keyCode == 13) {
                model.setBottom($(this).val());
                self.$('top', id).val(model.getTop());
            }
        });

        this.$('remove', id).live('click', function() {
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
        var self = this;

        this.$('text', id).live('keyup', function(e) {
            model.reload({text: $(this).val()});
        });

        this.$('animation', id).live('change', function() {
            model.reload({animation: $(this).val()});
        });

        this.$('interval', id).live('keyup', function(e) {
            if (e.keyCode == 13) {
                model.reload({interval: $(this).val()});
            }
        });

        this.$('font-size', id).live('keyup', function(e) {
            if (e.keyCode == 13) {
                model.reload({style: { 'font-size': $(this).val() + 'px' }});
            }
        });

        this.$('color', id).live('change', function(e) {
            model.reload({style: { 'color': $(this).val() }});
        });

        this.$('border-color', id).live('change', function(e) {
            model.reload({style: { 'border-color': $(this).val() }});
        });

        this.$('style', id).live('change', function() {
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
        var count = 1;
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
            $('#webvfx-data-' + lastId).show();
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
    },
    initialize: function() {
        var config = appCollection.models[0].get('Webvfx').Editor;
        this.options = {
            width: config.width,
            height: config.height,
            scale: config.scale,
            server: config.server
        };
        var debounce_resize = _.debounce( _.bind(this.render, this), 300);
        $(window).on('resize', debounce_resize);
        this.render();
    },
    render: function() {
        var self = this;
        $(this.el).html(template.editor(this.options));

        this.webvfxCollection = new WebvfxCollection();

        var sketchs = new Sketch.Collection();
        this.sketchs = sketchs;

        this.sketchs.fetch({ success: function() {
                self.getSketchs();
            }
        });

        var webvfxCollectionView = new WebvfxCollectionView({
            collection: this.webvfxCollection,
            el: $("#webvfx-collection", self.$el)
        });

        $(document).ready(function() {
            self.options.scale = self.autoScale();
            window.webvfxEditor = new WebvfxEditor(self.options);
            window.webvfxEditor.objects = self.webvfxCollection;
            self.makeSortable();
            self.updateCss();
            self.updateVideoStream();
            self.updateStatusBar();
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
            if (s.type == 'image') {
                s.image = new Image();
                s.image.src = self.options.server + 'uploads/' + s.name;
                s.image.name = s.name;
                self.webvfxCollection.add(new WebvfxImage(s));
            } else {
                self.webvfxCollection.add(new WebvfxWidget(s));
            }
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
    safeArea: function() {
        if (this.safeAreaLayer === undefined) {
            console.log('creating safe area');
            this.createSafeArea();
        }
        if ($("#safe-area").is(':checked')) {
            console.log('showing safe area');
            this.safeAreaLayer.show();
            this.safeAreaLayer.draw();
        } else {
            console.log('hiding safe area');
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
            $('#container').removeClass('container-background');
            $(video).show();
        } else {
            console.log('hiding video preview');
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
        this.webvfxCollection.sendAll();
    },
    clearVideo:  function () {
        console.log('manual clear');
        webvfxClient.removeAll();
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
    readFile : function(file) {
        if( (/image/i).test(file.type) ) {
            var self = this;
            var reader = new FileReader();
            reader.onload = function(e) {
                console.log('loaded ' + file.name);
                self.uploadImage(file, e);
            };
            reader.readAsDataURL(file);
        } else {
            var description = i18n.gettext('File format not supported');
            this.alert(description);
        }
    },
    uploadImage : function(file, e) {
        var self = this;
        var formdata = new FormData();
        formdata.append('uploadedFile', file);
        $.ajax({
            url: self.options.server + 'uploadImage',
            type: 'POST',
            data: formdata,
            processData: false,
            contentType: false,
            success: function(res) {
                console.log('uploaded ' + file.name);
                image = new Image();
                image.name = file.name;
                image.type = file.type;
                image.src = e.target.result;
                self.webvfxCollection.new = true;
                self.webvfxCollection.add(
                    new WebvfxImage({image: image, name: file.name})
                );
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
        video.width = webvfxEditor.get('width');
        video.height = webvfxEditor.get('height');
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
                $('#files').click();
                break;

            case 'text':
                this.webvfxCollection.new = true;
                this.webvfxCollection.add(new WebvfxWidget({
                    type: type,
                    text: "",
                    interval: 0,
                    style: $.extend({}, {
                        width: '500px',
                        height: '60px',
                        'line-height': '60px',
                    }, WebvfxSimpleWidgetStyles['fire']),
                }));
                break;

            case 'box':
                this.webvfxCollection.new = true;
                this.webvfxCollection.add(new WebvfxWidget({
                    type: type,
                    text: "",
                    interval: 0,
                    style: $.extend({}, {
                        width: '300px',
                        height: '30px',
                        'line-height': '30px',
                    }, WebvfxSimpleWidgetStyles['heaven']),
                }));
                break;

            case 'time':
                this.webvfxCollection.new = true;
                this.webvfxCollection.add(new WebvfxWidget({
                    type: type,
                    text: "%H:%M:%S",
                    interval: 500,
                    style: $.extend({}, {
                        width: '100px',
                        height: '30px',
                        'line-height': '30px',
                    }, WebvfxSimpleWidgetStyles['black']),
                }));
                break;

            case 'weather':
                this.webvfxCollection.new = true;
                this.webvfxCollection.add(new WebvfxWidget({
                    type: type,
                    text: "%T%Tunit %H%Hunit",
                    interval: 2000,
                    style: $.extend({}, {
                        width: '100px',
                        height: '30px',
                        'line-height': '30px',
                    }, WebvfxSimpleWidgetStyles['gray']),
                }));
                break;
        }

        $('#objects').val('');
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
