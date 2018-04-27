import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, HostListener, Input, NgModule, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer } from '@angular/platform-browser';

class ImageCropperComponent {
    /**
     * @param {?} elementRef
     * @param {?} sanitizer
     * @param {?} cd
     */
    constructor(elementRef, sanitizer, cd) {
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
    /**
     * @param {?} event
     * @return {?}
     */
    set imageChangedEvent(event) {
        this.initCropper();
        if (event && event.target && event.target.files && event.target.files.length > 0) {
            this.loadImage(event);
        }
    }
    /**
     * @param {?} imageBase64
     * @return {?}
     */
    set imageBase64(imageBase64) {
        this.initCropper();
        this.loadBase64Image(imageBase64);
    }
    /**
     * @param {?} changes
     * @return {?}
     */
    ngOnChanges(changes) {
        if (changes['cropper']) {
            setTimeout(() => {
                this.setMaxSize();
                this.checkCropperPosition(false);
                this.crop();
                this.cd.markForCheck();
            });
        }
    }
    /**
     * @return {?}
     */
    initCropper() {
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
    }
    /**
     * @param {?} event
     * @return {?}
     */
    loadImage(event) {
        const /** @type {?} */ fileReader = new FileReader();
        fileReader.onload = (ev) => {
            if (event.target.files[0].type === 'image/jpeg' ||
                event.target.files[0].type === 'image/jpg' ||
                event.target.files[0].type === 'image/png' ||
                event.target.files[0].type === 'image/gif') {
                this.loadBase64Image(ev.target.result);
            }
            else {
                this.loadImageFailed.emit();
            }
        };
        fileReader.readAsDataURL(event.target.files[0]);
    }
    /**
     * @param {?} imageBase64
     * @return {?}
     */
    loadBase64Image(imageBase64) {
        this.originalImage = new Image();
        this.originalImage.onload = () => {
            this.originalSize.width = this.originalImage.width;
            this.originalSize.height = this.originalImage.height;
            this.cd.markForCheck();
        };
        this.safeImgDataUrl = this.sanitizer.bypassSecurityTrustResourceUrl(imageBase64);
        this.originalImage.src = imageBase64;
    }
    /**
     * @return {?}
     */
    imageLoadedInView() {
        if (this.originalImage != null) {
            this.imageLoaded.emit();
            setTimeout(() => {
                this.setMaxSize();
                this.resetCropperPosition();
                this.cd.markForCheck();
            });
        }
    }
    /**
     * @return {?}
     */
    resetCropperPosition() {
        const /** @type {?} */ displayedImage = this.elementRef.nativeElement.querySelector('.source-image');
        if (displayedImage.offsetWidth / this.aspectRatio < displayedImage.offsetHeight) {
            this.cropper.x1 = 0;
            this.cropper.x2 = displayedImage.offsetWidth;
            const /** @type {?} */ cropperHeight = displayedImage.offsetWidth / this.aspectRatio;
            this.cropper.y1 = (displayedImage.offsetHeight - cropperHeight) / 2;
            this.cropper.y2 = this.cropper.y1 + cropperHeight;
        }
        else {
            this.cropper.y1 = 0;
            this.cropper.y2 = displayedImage.offsetHeight;
            const /** @type {?} */ cropperWidth = displayedImage.offsetHeight * this.aspectRatio;
            this.cropper.x1 = (displayedImage.offsetWidth - cropperWidth) / 2;
            this.cropper.x2 = this.cropper.x1 + cropperWidth;
        }
        this.crop();
        this.imageVisible = true;
    }
    /**
     * @param {?} event
     * @param {?} moveType
     * @param {?=} position
     * @return {?}
     */
    startMove(event, moveType, position = null) {
        this.moveStart.active = true;
        this.moveStart.type = moveType;
        this.moveStart.position = position;
        this.moveStart.clientX = this.getClientX(event);
        this.moveStart.clientY = this.getClientY(event);
        Object.assign(this.moveStart, this.cropper);
        this.cd.markForCheck();
    }
    /**
     * @param {?} event
     * @return {?}
     */
    moveImg(event) {
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
    }
    /**
     * @return {?}
     */
    setMaxSize() {
        const /** @type {?} */ el = this.elementRef.nativeElement.querySelector('.source-image');
        this.maxSize.width = el.offsetWidth;
        this.maxSize.height = el.offsetHeight;
        this.marginLeft = this.sanitizer.bypassSecurityTrustStyle('calc(50% - ' + this.maxSize.width / 2 + 'px)');
    }
    /**
     * @param {?=} maintainSize
     * @return {?}
     */
    checkCropperPosition(maintainSize = false) {
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
    }
    /**
     * @param {?} event
     * @return {?}
     */
    moveStop(event) {
        if (this.moveStart.active) {
            this.moveStart.active = false;
            this.crop();
            this.cd.markForCheck();
        }
    }
    /**
     * @param {?} event
     * @return {?}
     */
    move(event) {
        const /** @type {?} */ diffX = this.getClientX(event) - this.moveStart.clientX;
        const /** @type {?} */ diffY = this.getClientY(event) - this.moveStart.clientY;
        this.cropper.x1 = this.moveStart.x1 + diffX;
        this.cropper.y1 = this.moveStart.y1 + diffY;
        this.cropper.x2 = this.moveStart.x2 + diffX;
        this.cropper.y2 = this.moveStart.y2 + diffY;
    }
    /**
     * @param {?} event
     * @return {?}
     */
    resize(event) {
        const /** @type {?} */ diffX = this.getClientX(event) - this.moveStart.clientX;
        const /** @type {?} */ diffY = this.getClientY(event) - this.moveStart.clientY;
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
    }
    /**
     * @return {?}
     */
    checkAspectRatio() {
        let /** @type {?} */ overflowX = 0;
        let /** @type {?} */ overflowY = 0;
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
    }
    /**
     * @return {?}
     */
    crop() {
        const /** @type {?} */ displayedImage = this.elementRef.nativeElement.querySelector('.source-image');
        if (displayedImage && this.originalImage != null) {
            const /** @type {?} */ ratio = this.originalSize.width / displayedImage.offsetWidth;
            const /** @type {?} */ left = Math.round(this.cropper.x1 * ratio);
            const /** @type {?} */ top = Math.round(this.cropper.y1 * ratio);
            const /** @type {?} */ width = Math.round((this.cropper.x2 - this.cropper.x1) * ratio);
            const /** @type {?} */ height = Math.round((this.cropper.y2 - this.cropper.y1) * ratio);
            const /** @type {?} */ resizeRatio = this.getResizeRatio(width);
            const /** @type {?} */ cropCanvas = (document.createElement('canvas'));
            cropCanvas.width = width * resizeRatio;
            cropCanvas.height = height * resizeRatio;
            const /** @type {?} */ ctx = cropCanvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(this.originalImage, left, top, width, height, 0, 0, width * resizeRatio, height * resizeRatio);
                const /** @type {?} */ quality = Math.min(1, Math.max(0, this.imageQuality / 100));
                const /** @type {?} */ croppedImage = cropCanvas.toDataURL('image/' + this.format, quality);
                if (croppedImage.length > 10) {
                    this.imageCropped.emit(croppedImage);
                }
            }
        }
    }
    /**
     * @param {?} width
     * @return {?}
     */
    getResizeRatio(width) {
        return this.resizeToWidth > 0 && (!this.onlyScaleDown || width > this.resizeToWidth)
            ? this.resizeToWidth / width
            : 1;
    }
    /**
     * @param {?} event
     * @return {?}
     */
    getClientX(event) {
        return event.clientX != null ? event.clientX : event.touches[0].clientX;
    }
    /**
     * @param {?} event
     * @return {?}
     */
    getClientY(event) {
        return event.clientY != null ? event.clientY : event.touches[0].clientY;
    }
}
ImageCropperComponent.decorators = [
    { type: Component, args: [{
                selector: 'image-cropper',
                template: `
      <div>
          <img
              [src]="safeImgDataUrl"
              [style.visibility]="imageVisible ? 'visible' : 'hidden'"
              (load)="imageLoadedInView()"
              class="source-image"
          />
          <div class="cropper"
               [style.top.px]="cropper.y1"
               [style.left.px]="cropper.x1"
               [style.width.px]="cropper.x2 - cropper.x1"
               [style.height.px]="cropper.y2 - cropper.y1"
               [style.margin-left]="marginLeft"
               [style.visibility]="imageVisible ? 'visible' : 'hidden'"
          >
              <div
                  (mousedown)="startMove($event, 'move')"
                  (touchstart)="startMove($event, 'move')"
                  class="move"
              >&nbsp;</div>
              <span
                  class="resize topleft"
                  (mousedown)="startMove($event, 'resize', 'topleft')"
                  (touchstart)="startMove($event, 'resize', 'topleft')"
              ><span class="square"></span></span>
              <span
                  class="resize top"
              ><span class="square"></span></span>
              <span
                  class="resize topright"
                  (mousedown)="startMove($event, 'resize', 'topright')"
                  (touchstart)="startMove($event, 'resize', 'topright')"
              ><span class="square"></span></span>
              <span
                  class="resize right"
              ><span class="square"></span></span>
              <span
                  class="resize bottomright"
                  (mousedown)="startMove($event, 'resize', 'bottomright')"
                  (touchstart)="startMove($event, 'resize', 'bottomright')"
              ><span class="square"></span></span>
              <span
                  class="resize bottom"
              ><span class="square"></span></span>
              <span
                  class="resize bottomleft"
                  (mousedown)="startMove($event, 'resize', 'bottomleft')"
                  (touchstart)="startMove($event, 'resize', 'bottomleft')"
              ><span class="square"></span></span>
              <span
                  class="resize left"
              ><span class="square"></span></span>
              <span
                  class="resize-bar top"
                  (mousedown)="startMove($event, 'resize', 'top')"
                  (touchstart)="startMove($event, 'resize', 'top')"
              ></span>
              <span
                  class="resize-bar right"
                  (mousedown)="startMove($event, 'resize', 'right')"
                  (touchstart)="startMove($event, 'resize', 'right')"
              ></span>
              <span
                  class="resize-bar bottom"
                  (mousedown)="startMove($event, 'resize', 'bottom')"
                  (touchstart)="startMove($event, 'resize', 'bottom')"
              ></span>
              <span
                  class="resize-bar left"
                  (mousedown)="startMove($event, 'resize', 'left')"
                  (touchstart)="startMove($event, 'resize', 'left')"
              ></span>
          </div>
      </div>
    `,
                styles: [`
      :host {
        display: -webkit-box;
        display: -ms-flexbox;
        display: flex;
        position: relative;
        width: 100%;
        max-width: 100%;
        max-height: 100%;
        overflow: hidden;
        padding: 5px;
        text-align: center;
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none; }
        :host > div {
          position: relative;
          width: 100%; }
          :host > div .source-image {
            max-width: 100%;
            max-height: 100%; }
        :host .cropper {
          position: absolute;
          display: -webkit-box;
          display: -ms-flexbox;
          display: flex;
          color: #53535C !important;
          background: transparent !important;
          outline-color: rgba(255, 255, 255, 0.3);
          outline-width: 1000px;
          outline-style: solid;
          -ms-touch-action: none;
              touch-action: none; }
          :host .cropper:after {
            position: absolute;
            content: '';
            top: 0;
            bottom: 0;
            left: 0;
            right: 0;
            pointer-events: none;
            border: dashed 1px;
            opacity: .75;
            color: inherit;
            z-index: 1; }
          :host .cropper .move {
            width: 100%;
            cursor: move;
            border: 1px solid rgba(255, 255, 255, 0.5); }
          :host .cropper .resize {
            position: absolute;
            display: inline-block;
            line-height: 6px;
            padding: 8px;
            opacity: .85;
            z-index: 1; }
            :host .cropper .resize .square {
              display: inline-block;
              background: #53535C !important;
              width: 6px;
              height: 6px;
              border: 1px solid rgba(255, 255, 255, 0.5); }
            :host .cropper .resize.topleft {
              top: -12px;
              left: -12px;
              cursor: nw-resize; }
            :host .cropper .resize.top {
              top: -12px;
              left: calc(50% - 12px);
              cursor: n-resize; }
            :host .cropper .resize.topright {
              top: -12px;
              right: -12px;
              cursor: ne-resize; }
            :host .cropper .resize.right {
              top: calc(50% - 12px);
              right: -12px;
              cursor: e-resize; }
            :host .cropper .resize.bottomright {
              bottom: -12px;
              right: -12px;
              cursor: se-resize; }
            :host .cropper .resize.bottom {
              bottom: -12px;
              left: calc(50% - 12px);
              cursor: s-resize; }
            :host .cropper .resize.bottomleft {
              bottom: -12px;
              left: -12px;
              cursor: sw-resize; }
            :host .cropper .resize.left {
              top: calc(50% - 12px);
              left: -12px;
              cursor: w-resize; }
          :host .cropper .resize-bar {
            position: absolute;
            z-index: 1; }
            :host .cropper .resize-bar.top {
              top: -11px;
              left: 11px;
              width: calc(100% - 22px);
              height: 22px;
              cursor: n-resize; }
            :host .cropper .resize-bar.right {
              top: 11px;
              right: -11px;
              height: calc(100% - 22px);
              width: 22px;
              cursor: e-resize; }
            :host .cropper .resize-bar.bottom {
              bottom: -11px;
              left: 11px;
              width: calc(100% - 22px);
              height: 22px;
              cursor: s-resize; }
            :host .cropper .resize-bar.left {
              top: 11px;
              left: -11px;
              height: calc(100% - 22px);
              width: 22px;
              cursor: w-resize; }
    `],
                changeDetection: ChangeDetectionStrategy.OnPush
            },] },
];
/**
 * @nocollapse
 */
ImageCropperComponent.ctorParameters = () => [
    { type: ElementRef, },
    { type: DomSanitizer, },
    { type: ChangeDetectorRef, },
];
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

class ImageCropperModule {
}
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
ImageCropperModule.ctorParameters = () => [];

/**
 * Generated bundle index. Do not edit.
 */

export { ImageCropperModule, ImageCropperComponent };
//# sourceMappingURL=ngx-image-cropper.js.map
