import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExifService } from './exif.service';
import { ImageCropperComponent } from './image-cropper.component';
import { ImageCropperExifService } from './image-cropper-exif.service';

@NgModule({
    imports: [
        CommonModule
    ],
    declarations: [
        ImageCropperComponent
    ],
    exports: [
        ImageCropperComponent
    ],
    /**
     * Expose Services and Providers into Angular's dependency injection.
     */
    providers: [
        ExifService,
        ImageCropperExifService
    ]
})
export class ImageCropperModule {}
