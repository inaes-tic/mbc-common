/* Mocks */
Sketch = {
    LiveCollection: function() {},
};

appCollection = {models: [{get: function() {
    return {
        Widgets: {WeatherWoeid: 54},
        General: {fps: 30},
    }
}}]};

Blob = function() {};
webkitURL = {
    createObjectURL: function() {return 'autobots.png'},
};

Tools = {
    getIntValues: function() {
        return {width: 10, height: 5, top: 0, left: 0};
    },
    toCssStyleString: function() {
        return '';
    },
};
/* end Mocks */


describe("Webvfx Models", function() {

    before(function() {
        window.webvfxEditor = this.webvfxEditor = new WebvfxEditor({
            width: 1920,
            height: 1080,
            scale: .5,
        });
    });


    describe("WebvfxEditor", function() {

        it("The scaled width must be 960", function() {
            expect( this.webvfxEditor.getScaledWidth() ).equals(960);
        });

        it("The scaled height must be 540", function() {
            expect( this.webvfxEditor.getScaledHeight() ).equals(540);
        });

    });

    describe("WebvfxImage", function() {

        before(function() {
            this.webvfxImage = new WebvfxImage({ });
        });

        it("isImage() must return true", function() {
            expect( this.webvfxImage.isImage() ).equals(true);
        });

        it("isAnimation() must return false", function() {
            expect( this.webvfxImage.isAnimation() ).equals(false);
        });

    });

    describe("WebvfxAnimation", function() {

        before(function(done) {
            var self = this;
            var image = new Image();
            image.src = 'autobots.png';
            image.onload = function() {
                self.webvfxAnimation = new WebvfxAnimation({
                    image: image,
                    frames: 40,
                });
                done();
            }
        });

        it("isAnimation() must return true", function(done) {
            expect( this.webvfxAnimation.isAnimation() ).equals(true);
            done();
        });

        it("isImage() must return false", function() {
            expect( this.webvfxAnimation.isImage() ).equals(false);
        });

    });

    describe("WebvfxWidget", function() {

        before(function(done) {
            this.webvfxWidget = new WebvfxWidget({
                options: {
                    type: 'text',
                    style: {},
                }
            });
            done();
        });

        it("isWidget() must return true", function(done) {
            expect( this.webvfxWidget.isWidget() ).equals(true);
            done();
        });

        it("isImage() must return false", function() {
            expect( this.webvfxWidget.isImage() ).equals(false);
        });

    });

    describe("WebvfxCollection", function() {

        before(function(done) {
            window.webvfxCollection = this.webvfxCollection = new WebvfxCollection([
                new WebvfxWidget({options: {type: 'text', text: 'two'  , style: {}}, zindex: 2}),
                new WebvfxWidget({options: {type: 'text', text: 'three', style: {}}, zindex: 3}),
                new WebvfxWidget({options: {type: 'text', text: 'one'  , style: {}}, zindex: 1})
            ]);
            done();
        });

        it("webvfxCollection.length must return 3", function(done) {
            expect( this.webvfxCollection.length ).equals(3);
            done();
        });

        it("The first element on collection must have text 'one'", function() {
            expect( this.webvfxCollection.models[0].getText() ).equals('one');
        });

        it("The last element on collection must have text 'three'", function() {
            expect( this.webvfxCollection.models[2].getText() ).equals('three');
        });

    });

});

