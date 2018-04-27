import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, HostListener, Input, NgModule, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer } from '@angular/platform-browser';
var ImageCropperComponent = (function () {
    /**
     * @param {?} elementRef
     * @param {?} sanitizer
     * @param {?} cd
     */
    function ImageCropperComponent(elementRef, sanitizer, cd) {
        this.elementRef = elementRef;
        this.sanitizer = sanitizer;
        this.cd = cd;
        this.marginLeft = '0px';
        this.imageVisible = false;
        this.format = 'png';
        this.maintainAspectRatio = true;
        this.aspectRatio = 1;
        this.resizeToWidth = 0;
        this.onlyScaleDown = false;
        this.imageQuality = 92;
        this.cropper = {
            x1: -100,
            y1: -100,
            x2: 10000,
            y2: 10000
        };
        this.imageCropped = new EventEmitter();
        this.imageLoaded = new EventEmitter();
        this.loadImageFailed = new EventEmitter();
        this.initCropper();
    }
    Object.defineProperty(ImageCropperComponent.prototype, "imageChangedEvent", {
        /**
         * @param {?} event
         * @return {?}
         */
        set: function (event) {
            this.initCropper();
            if (event && event.target && event.target.files && event.target.files.length > 0) {
                this.loadImage(event);
            }
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ImageCropperComponent.prototype, "imageBase64", {
        /**
         * @param {?} imageBase64
         * @return {?}
         */
        set: function (imageBase64) {
            this.initCropper();
            this.loadBase64Image(imageBase64);
        },
        enumerable: true,
        configurable: true
    });
    /**
     * @param {?} changes
     * @return {?}
     */
    ImageCropperComponent.prototype.ngOnChanges = function (changes) {
        var _this = this;
        if (changes['cropper']) {
            setTimeout(function () {
                _this.setMaxSize();
                _this.checkCropperPosition(false);
                _this.crop();
                _this.cd.markForCheck();
            });
        }
    };
    /**
     * @return {?}
     */
    ImageCropperComponent.prototype.initCropper = function () {
        this.imageVisible = false;
        this.originalImage = null;
        this.safeImgDataUrl = 'data:image/png;base64,iVBORw0KGg'
            + 'oAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQYV2NgAAIAAAU'
            + 'AAarVyFEAAAAASUVORK5CYII=';
        this.moveStart = {
            active: false,
            type: null,
            position: null,
            x1: 0,
            y1: 0,
            x2: 0,
            y2: 0,
            clientX: 0,
            clientY: 0
        };
        this.maxSize = {
            width: 0,
            height: 0
        };
        this.originalSize = {
            width: 0,
            height: 0
        };
        this.cropper.x1 = -100;
        this.cropper.y1 = -100;
        this.cropper.x2 = 10000;
        this.cropper.y2 = 10000;
    };
    /**
     * @param {?} event
     * @return {?}
     */
    ImageCropperComponent.prototype.loadImage = function (event) {
        var _this = this;
        var /** @type {?} */ fileReader = new FileReader();
        fileReader.onload = function (ev) {
            if (event.target.files[0].type === 'image/jpeg' ||
                event.target.files[0].type === 'image/jpg' ||
                event.target.files[0].type === 'image/png' ||
                event.target.files[0].type === 'image/gif') {
                _this.loadBase64Image(ev.target.result);
            }
            else {
                _this.loadImageFailed.emit();
            }
        };
        fileReader.readAsDataURL(event.target.files[0]);
    };
    /**
     * @param {?} imageBase64
     * @return {?}
     */
    ImageCropperComponent.prototype.loadBase64Image = function (imageBase64) {
        var _this = this;
        this.originalImage = new Image();
        this.originalImage.onload = function () {
            _this.originalSize.width = _this.originalImage.width;
            _this.originalSize.height = _this.originalImage.height;
            _this.cd.markForCheck();
        };
        this.safeImgDataUrl = this.sanitizer.bypassSecurityTrustResourceUrl(imageBase64);
        this.originalImage.src = imageBase64;
    };
    /**
     * @return {?}
     */
    ImageCropperComponent.prototype.imageLoadedInView = function () {
        var _this = this;
        if (this.originalImage != null) {
            this.imageLoaded.emit();
            setTimeout(function () {
                _this.setMaxSize();
                _this.resetCropperPosition();
                _this.cd.markForCheck();
            });
        }
    };
    /**
     * @return {?}
     */
    ImageCropperComponent.prototype.resetCropperPosition = function () {
        var /** @type {?} */ displayedImage = this.elementRef.nativeElement.querySelector('.source-image');
        if (displayedImage.offsetWidth / this.aspectRatio < displayedImage.offsetHeight) {
            this.cropper.x1 = 0;
            this.cropper.x2 = displayedImage.offsetWidth;
            var /** @type {?} */ cropperHeight = displayedImage.offsetWidth / this.aspectRatio;
            this.cropper.y1 = (displayedImage.offsetHeight - cropperHeight) / 2;
            this.cropper.y2 = this.cropper.y1 + cropperHeight;
        }
        else {
            this.cropper.y1 = 0;
            this.cropper.y2 = displayedImage.offsetHeight;
            var /** @type {?} */ cropperWidth = displayedImage.offsetHeight * this.aspectRatio;
            this.cropper.x1 = (displayedImage.offsetWidth - cropperWidth) / 2;
            this.cropper.x2 = this.cropper.x1 + cropperWidth;
        }
        this.crop();
        this.imageVisible = true;
    };
    /**
     * @param {?} event
     * @param {?} moveType
     * @param {?=} position
     * @return {?}
     */
    ImageCropperComponent.prototype.startMove = function (event, moveType, position) {
        if (position === void 0) { position = null; }
        this.moveStart.active = true;
        this.moveStart.type = moveType;
        this.moveStart.position = position;
        this.moveStart.clientX = this.getClientX(event);
        this.moveStart.clientY = this.getClientY(event);
        Object.assign(this.moveStart, this.cropper);
        this.cd.markForCheck();
    };
    /**
     * @param {?} event
     * @return {?}
     */
    ImageCropperComponent.prototype.moveImg = function (event) {
        if (this.moveStart.active) {
            event.stopPropagation();
            event.preventDefault();
            this.setMaxSize();
            if (this.moveStart.type === 'move') {
                this.move(event);
                this.checkCropperPosition(true);
            }
            else if (this.moveStart.type === 'resize') {
                this.resize(event);
                this.checkCropperPosition(false);
            }
            this.cd.markForCheck();
        }
    };
    /**
     * @return {?}
     */
    ImageCropperComponent.prototype.setMaxSize = function () {
        var /** @type {?} */ el = this.elementRef.nativeElement.querySelector('.source-image');
        this.maxSize.width = el.offsetWidth;
        this.maxSize.height = el.offsetHeight;
        this.marginLeft = this.sanitizer.bypassSecurityTrustStyle('calc(50% - ' + this.maxSize.width / 2 + 'px)');
    };
    /**
     * @param {?=} maintainSize
     * @return {?}
     */
    ImageCropperComponent.prototype.checkCropperPosition = function (maintainSize) {
        if (maintainSize === void 0) { maintainSize = false; }
        if (this.cropper.x1 < 0) {
            this.cropper.x2 -= maintainSize ? this.cropper.x1 : 0;
            this.cropper.x1 = 0;
        }
        if (this.cropper.y1 < 0) {
            this.cropper.y2 -= maintainSize ? this.cropper.y1 : 0;
            this.cropper.y1 = 0;
        }
        if (this.cropper.x2 > this.maxSize.width) {
            this.cropper.x1 -= maintainSize ? (this.cropper.x2 - this.maxSize.width) : 0;
            this.cropper.x2 = this.maxSize.width;
        }
        if (this.cropper.y2 > this.maxSize.height) {
            this.cropper.y1 -= maintainSize ? (this.cropper.y2 - this.maxSize.height) : 0;
            this.cropper.y2 = this.maxSize.height;
        }
    };
    /**
     * @param {?} event
     * @return {?}
     */
    ImageCropperComponent.prototype.moveStop = function (event) {
        if (this.moveStart.active) {
            this.moveStart.active = false;
            this.crop();
            this.cd.markForCheck();
        }
    };
    /**
     * @param {?} event
     * @return {?}
     */
    ImageCropperComponent.prototype.move = function (event) {
        var /** @type {?} */ diffX = this.getClientX(event) - this.moveStart.clientX;
        var /** @type {?} */ diffY = this.getClientY(event) - this.moveStart.clientY;
        this.cropper.x1 = this.moveStart.x1 + diffX;
        this.cropper.y1 = this.moveStart.y1 + diffY;
        this.cropper.x2 = this.moveStart.x2 + diffX;
        this.cropper.y2 = this.moveStart.y2 + diffY;
    };
    /**
     * @param {?} event
     * @return {?}
     */
    ImageCropperComponent.prototype.resize = function (event) {
        var /** @type {?} */ diffX = this.getClientX(event) - this.moveStart.clientX;
        var /** @type {?} */ diffY = this.getClientY(event) - this.moveStart.clientY;
        switch (this.moveStart.position) {
            case 'left':
                this.cropper.x1 = Math.min(this.moveStart.x1 + diffX, this.cropper.x2 - 20);
                break;
            case 'topleft':
                this.cropper.x1 = Math.min(this.moveStart.x1 + diffX, this.cropper.x2 - 20);
                this.cropper.y1 = Math.min(this.moveStart.y1 + diffY, this.cropper.y2 - 20);
                break;
            case 'top':
                this.cropper.y1 = Math.min(this.moveStart.y1 + diffY, this.cropper.y2 - 20);
                break;
            case 'topright':
                this.cropper.x2 = Math.max(this.moveStart.x2 + diffX, this.cropper.x1 + 20);
                this.cropper.y1 = Math.min(this.moveStart.y1 + diffY, this.cropper.y2 - 20);
                break;
            case 'right':
                this.cropper.x2 = Math.max(this.moveStart.x2 + diffX, this.cropper.x1 + 20);
                break;
            case 'bottomright':
                this.cropper.x2 = Math.max(this.moveStart.x2 + diffX, this.cropper.x1 + 20);
                this.cropper.y2 = Math.max(this.moveStart.y2 + diffY, this.cropper.y1 + 20);
                break;
            case 'bottom':
                this.cropper.y2 = Math.max(this.moveStart.y2 + diffY, this.cropper.y1 + 20);
                break;
            case 'bottomleft':
                this.cropper.x1 = Math.min(this.moveStart.x1 + diffX, this.cropper.x2 - 20);
                this.cropper.y2 = Math.max(this.moveStart.y2 + diffY, this.cropper.y1 + 20);
                break;
        }
        if (this.maintainAspectRatio) {
            this.checkAspectRatio();
        }
    };
    /**
     * @return {?}
     */
    ImageCropperComponent.prototype.checkAspectRatio = function () {
        var /** @type {?} */ overflowX = 0;
        var /** @type {?} */ overflowY = 0;
        switch (this.moveStart.position) {
            case 'top':
                this.cropper.x2 = this.cropper.x1 + (this.cropper.y2 - this.cropper.y1) * this.aspectRatio;
                overflowX = Math.max(this.cropper.x2 - this.maxSize.width, 0);
                overflowY = Math.max(0 - this.cropper.y1, 0);
                if (overflowX > 0 || overflowY > 0) {
                    this.cropper.x2 -= (overflowY * this.aspectRatio) > overflowX ? (overflowY * this.aspectRatio) : overflowX;
                    this.cropper.y1 += (overflowY * this.aspectRatio) > overflowX ? overflowY : overflowX / this.aspectRatio;
                }
                break;
            case 'bottom':
                this.cropper.x2 = this.cropper.x1 + (this.cropper.y2 - this.cropper.y1) * this.aspectRatio;
                overflowX = Math.max(this.cropper.x2 - this.maxSize.width, 0);
                overflowY = Math.max(this.cropper.y2 - this.maxSize.height, 0);
                if (overflowX > 0 || overflowY > 0) {
                    this.cropper.x2 -= (overflowY * this.aspectRatio) > overflowX ? (overflowY * this.aspectRatio) : overflowX;
                    this.cropper.y2 -= (overflowY * this.aspectRatio) > overflowX ? overflowY : (overflowX / this.aspectRatio);
                }
                break;
            case 'topleft':
                this.cropper.y1 = this.cropper.y2 - (this.cropper.x2 - this.cropper.x1) / this.aspectRatio;
                overflowX = Math.max(0 - this.cropper.x1, 0);
                overflowY = Math.max(0 - this.cropper.y1, 0);
                if (overflowX > 0 || overflowY > 0) {
                    this.cropper.x1 += (overflowY * this.aspectRatio) > overflowX ? (overflowY * this.aspectRatio) : overflowX;
                    this.cropper.y1 += (overflowY * this.aspectRatio) > overflowX ? overflowY : overflowX / this.aspectRatio;
                }
                break;
            case 'topright':
                this.cropper.y1 = this.cropper.y2 - (this.cropper.x2 - this.cropper.x1) / this.aspectRatio;
                overflowX = Math.max(this.cropper.x2 - this.maxSize.width, 0);
                overflowY = Math.max(0 - this.cropper.y1, 0);
                if (overflowX > 0 || overflowY > 0) {
                    this.cropper.x2 -= (overflowY * this.aspectRatio) > overflowX ? (overflowY * this.aspectRatio) : overflowX;
                    this.cropper.y1 += (overflowY * this.aspectRatio) > overflowX ? overflowY : overflowX / this.aspectRatio;
                }
                break;
            case 'right':
            case 'bottomright':
                this.cropper.y2 = this.cropper.y1 + (this.cropper.x2 - this.cropper.x1) / this.aspectRatio;
                overflowX = Math.max(this.cropper.x2 - this.maxSize.width, 0);
                overflowY = Math.max(this.cropper.y2 - this.maxSize.height, 0);
                if (overflowX > 0 || overflowY > 0) {
                    this.cropper.x2 -= (overflowY * this.aspectRatio) > overflowX ? (overflowY * this.aspectRatio) : overflowX;
                    this.cropper.y2 -= (overflowY * this.aspectRatio) > overflowX ? overflowY : overflowX / this.aspectRatio;
                }
                break;
            case 'left':
            case 'bottomleft':
                this.cropper.y2 = this.cropper.y1 + (this.cropper.x2 - this.cropper.x1) / this.aspectRatio;
                overflowX = Math.max(0 - this.cropper.x1, 0);
                overflowY = Math.max(this.cropper.y2 - this.maxSize.height, 0);
                if (overflowX > 0 || overflowY > 0) {
                    this.cropper.x1 += (overflowY * this.aspectRatio) > overflowX ? (overflowY * this.aspectRatio) : overflowX;
                    this.cropper.y2 -= (overflowY * this.aspectRatio) > overflowX ? overflowY : overflowX / this.aspectRatio;
                }
                break;
        }
    };
    /**
     * @return {?}
     */
    ImageCropperComponent.prototype.crop = function () {
        var /** @type {?} */ displayedImage = this.elementRef.nativeElement.querySelector('.source-image');
        if (displayedImage && this.originalImage != null) {
            var /** @type {?} */ ratio = this.originalSize.width / displayedImage.offsetWidth;
            var /** @type {?} */ left = Math.round(this.cropper.x1 * ratio);
            var /** @type {?} */ top = Math.round(this.cropper.y1 * ratio);
            var /** @type {?} */ width = Math.round((this.cropper.x2 - this.cropper.x1) * ratio);
            var /** @type {?} */ height = Math.round((this.cropper.y2 - this.cropper.y1) * ratio);
            var /** @type {?} */ resizeRatio = this.getResizeRatio(width);
            var /** @type {?} */ cropCanvas = (document.createElement('canvas'));
            cropCanvas.width = width * resizeRatio;
            cropCanvas.height = height * resizeRatio;
            var /** @type {?} */ ctx = cropCanvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(this.originalImage, left, top, width, height, 0, 0, width * resizeRatio, height * resizeRatio);
                var /** @type {?} */ quality = Math.min(1, Math.max(0, this.imageQuality / 100));
                var /** @type {?} */ croppedImage = cropCanvas.toDataURL('image/' + this.format, quality);
                if (croppedImage.length > 10) {
                    this.imageCropped.emit(croppedImage);
                }
            }
        }
    };
    /**
     * @param {?} width
     * @return {?}
     */
    ImageCropperComponent.prototype.getResizeRatio = function (width) {
        return this.resizeToWidth > 0 && (!this.onlyScaleDown || width > this.resizeToWidth)
            ? this.resizeToWidth / width
            : 1;
    };
    /**
     * @param {?} event
     * @return {?}
     */
    ImageCropperComponent.prototype.getClientX = function (event) {
        return event.clientX != null ? event.clientX : event.touches[0].clientX;
    };
    /**
     * @param {?} event
     * @return {?}
     */
    ImageCropperComponent.prototype.getClientY = function (event) {
        return event.clientY != null ? event.clientY : event.touches[0].clientY;
    };
    return ImageCropperComponent;
}());
ImageCropperComponent.decorators = [
    { type: Component, args: [{
                selector: 'image-cropper',
                template: "\n      <div>\n          <img\n              [src]=\"safeImgDataUrl\"\n              [style.visibility]=\"imageVisible ? 'visible' : 'hidden'\"\n              (load)=\"imageLoadedInView()\"\n              class=\"source-image\"\n          />\n          <div class=\"cropper\"\n               [style.top.px]=\"cropper.y1\"\n               [style.left.px]=\"cropper.x1\"\n               [style.width.px]=\"cropper.x2 - cropper.x1\"\n               [style.height.px]=\"cropper.y2 - cropper.y1\"\n               [style.margin-left]=\"marginLeft\"\n               [style.visibility]=\"imageVisible ? 'visible' : 'hidden'\"\n          >\n              <div\n                  (mousedown)=\"startMove($event, 'move')\"\n                  (touchstart)=\"startMove($event, 'move')\"\n                  class=\"move\"\n              >&nbsp;</div>\n              <span\n                  class=\"resize topleft\"\n                  (mousedown)=\"startMove($event, 'resize', 'topleft')\"\n                  (touchstart)=\"startMove($event, 'resize', 'topleft')\"\n              ><span class=\"square\"></span></span>\n              <span\n                  class=\"resize top\"\n              ><span class=\"square\"></span></span>\n              <span\n                  class=\"resize topright\"\n                  (mousedown)=\"startMove($event, 'resize', 'topright')\"\n                  (touchstart)=\"startMove($event, 'resize', 'topright')\"\n              ><span class=\"square\"></span></span>\n              <span\n                  class=\"resize right\"\n              ><span class=\"square\"></span></span>\n              <span\n                  class=\"resize bottomright\"\n                  (mousedown)=\"startMove($event, 'resize', 'bottomright')\"\n                  (touchstart)=\"startMove($event, 'resize', 'bottomright')\"\n              ><span class=\"square\"></span></span>\n              <span\n                  class=\"resize bottom\"\n              ><span class=\"square\"></span></span>\n              <span\n                  class=\"resize bottomleft\"\n                  (mousedown)=\"startMove($event, 'resize', 'bottomleft')\"\n                  (touchstart)=\"startMove($event, 'resize', 'bottomleft')\"\n              ><span class=\"square\"></span></span>\n              <span\n                  class=\"resize left\"\n              ><span class=\"square\"></span></span>\n              <span\n                  class=\"resize-bar top\"\n                  (mousedown)=\"startMove($event, 'resize', 'top')\"\n                  (touchstart)=\"startMove($event, 'resize', 'top')\"\n              ></span>\n              <span\n                  class=\"resize-bar right\"\n                  (mousedown)=\"startMove($event, 'resize', 'right')\"\n                  (touchstart)=\"startMove($event, 'resize', 'right')\"\n              ></span>\n              <span\n                  class=\"resize-bar bottom\"\n                  (mousedown)=\"startMove($event, 'resize', 'bottom')\"\n                  (touchstart)=\"startMove($event, 'resize', 'bottom')\"\n              ></span>\n              <span\n                  class=\"resize-bar left\"\n                  (mousedown)=\"startMove($event, 'resize', 'left')\"\n                  (touchstart)=\"startMove($event, 'resize', 'left')\"\n              ></span>\n          </div>\n      </div>\n    ",
                styles: ["\n      :host {\n        display: -webkit-box;\n        display: -ms-flexbox;\n        display: flex;\n        position: relative;\n        width: 100%;\n        max-width: 100%;\n        max-height: 100%;\n        overflow: hidden;\n        padding: 5px;\n        text-align: center;\n        -webkit-user-select: none;\n        -moz-user-select: none;\n        -ms-user-select: none;\n        user-select: none; }\n        :host > div {\n          position: relative;\n          width: 100%; }\n          :host > div .source-image {\n            max-width: 100%;\n            max-height: 100%; }\n        :host .cropper {\n          position: absolute;\n          display: -webkit-box;\n          display: -ms-flexbox;\n          display: flex;\n          color: #53535C !important;\n          background: transparent !important;\n          outline-color: rgba(255, 255, 255, 0.3);\n          outline-width: 1000px;\n          outline-style: solid;\n          -ms-touch-action: none;\n              touch-action: none; }\n          :host .cropper:after {\n            position: absolute;\n            content: '';\n            top: 0;\n            bottom: 0;\n            left: 0;\n            right: 0;\n            pointer-events: none;\n            border: dashed 1px;\n            opacity: .75;\n            color: inherit;\n            z-index: 1; }\n          :host .cropper .move {\n            width: 100%;\n            cursor: move;\n            border: 1px solid rgba(255, 255, 255, 0.5); }\n          :host .cropper .resize {\n            position: absolute;\n            display: inline-block;\n            line-height: 6px;\n            padding: 8px;\n            opacity: .85;\n            z-index: 1; }\n            :host .cropper .resize .square {\n              display: inline-block;\n              background: #53535C !important;\n              width: 6px;\n              height: 6px;\n              border: 1px solid rgba(255, 255, 255, 0.5); }\n            :host .cropper .resize.topleft {\n              top: -12px;\n              left: -12px;\n              cursor: nw-resize; }\n            :host .cropper .resize.top {\n              top: -12px;\n              left: calc(50% - 12px);\n              cursor: n-resize; }\n            :host .cropper .resize.topright {\n              top: -12px;\n              right: -12px;\n              cursor: ne-resize; }\n            :host .cropper .resize.right {\n              top: calc(50% - 12px);\n              right: -12px;\n              cursor: e-resize; }\n            :host .cropper .resize.bottomright {\n              bottom: -12px;\n              right: -12px;\n              cursor: se-resize; }\n            :host .cropper .resize.bottom {\n              bottom: -12px;\n              left: calc(50% - 12px);\n              cursor: s-resize; }\n            :host .cropper .resize.bottomleft {\n              bottom: -12px;\n              left: -12px;\n              cursor: sw-resize; }\n            :host .cropper .resize.left {\n              top: calc(50% - 12px);\n              left: -12px;\n              cursor: w-resize; }\n          :host .cropper .resize-bar {\n            position: absolute;\n            z-index: 1; }\n            :host .cropper .resize-bar.top {\n              top: -11px;\n              left: 11px;\n              width: calc(100% - 22px);\n              height: 22px;\n              cursor: n-resize; }\n            :host .cropper .resize-bar.right {\n              top: 11px;\n              right: -11px;\n              height: calc(100% - 22px);\n              width: 22px;\n              cursor: e-resize; }\n            :host .cropper .resize-bar.bottom {\n              bottom: -11px;\n              left: 11px;\n              width: calc(100% - 22px);\n              height: 22px;\n              cursor: s-resize; }\n            :host .cropper .resize-bar.left {\n              top: 11px;\n              left: -11px;\n              height: calc(100% - 22px);\n              width: 22px;\n              cursor: w-resize; }\n    "],
                changeDetection: ChangeDetectionStrategy.OnPush
            },] },
];
/**
 * @nocollapse
 */
ImageCropperComponent.ctorParameters = function () { return [
    { type: ElementRef, },
    { type: DomSanitizer, },
    { type: ChangeDetectorRef, },
]; };
ImageCropperComponent.propDecorators = {
    'imageChangedEvent': [{ type: Input },],
    'imageBase64': [{ type: Input },],
    'format': [{ type: Input },],
    'maintainAspectRatio': [{ type: Input },],
    'aspectRatio': [{ type: Input },],
    'resizeToWidth': [{ type: Input },],
    'onlyScaleDown': [{ type: Input },],
    'imageQuality': [{ type: Input },],
    'cropper': [{ type: Input },],
    'imageCropped': [{ type: Output },],
    'imageLoaded': [{ type: Output },],
    'loadImageFailed': [{ type: Output },],
    'moveImg': [{ type: HostListener, args: ['document:mousemove', ['$event'],] }, { type: HostListener, args: ['document:touchmove', ['$event'],] },],
    'moveStop': [{ type: HostListener, args: ['document:mouseup', ['$event'],] }, { type: HostListener, args: ['document:touchend', ['$event'],] },],
};
var ImageCropperModule = (function () {
    function ImageCropperModule() {
    }
    return ImageCropperModule;
}());
ImageCropperModule.decorators = [
    { type: NgModule, args: [{
                imports: [
                    CommonModule
                ],
                declarations: [
                    ImageCropperComponent
                ],
                exports: [
                    ImageCropperComponent
                ]
            },] },
];
/**
 * @nocollapse
 */
ImageCropperModule.ctorParameters = function () { return []; };
/**
 * Generated bundle index. Do not edit.
 */
export { ImageCropperModule, ImageCropperComponent };
//# sourceMappingURL=ngx-image-cropper.es5.js.map
