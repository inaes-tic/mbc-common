/* Mocks */
var Sketch = {
    LiveCollection: function() {}
};
var appCollection = {models: [{get: function() {
    return {
        Widgets: {WeatherWoeid: 54},
        General: {fps: 30}
    }
}}]};
/* end Mocks */


describe("WebvfxEditor", function() {

    before(function() {
        this.webvfxEditor = new WebvfxEditor({
            width: 1920,
            height: 1080,
            scale: .5,
        });
        window.webvfxEditor = this.webvfxEditor;
    });

    it("The scaled width must be 960", function() {
        expect( this.webvfxEditor.getScaledWidth() ).equals(960);
    });

    it("The scaled height must be 540", function() {
        expect( this.webvfxEditor.getScaledHeight() ).equals(540);
    });

});

describe("WebvfxImage", function() {

    before(function() {
        window.webvfxEditor = new WebvfxEditor({
            width: 1920,
            height: 1080,
            scale: .5,
        });
        this.webvfxImage = new WebvfxImage({
        });
    });

    it("isImage() must return true", function() {
        expect( this.webvfxImage.isImage() ).equals(true);
    });

    it("isAnimation() must return false", function() {
        expect( this.webvfxImage.isAnimation() ).equals(false);
    });

});

