import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { ImageElement, ExifService } from './exif.service';

interface DestinationParameters {
    x: number;
    y: number;
    width: number;
    height: number;
    rotationDegree: number;
    imageOrientation: number;
}

@Injectable()
export class ImageCropperExifService {
    private invalidImageFormatProvided = 'Invalid image format provided.';

    /**
     * Check the image orientation from the EXIF data associated with the image.
     * If necessary, rotate and flip the image based on the orientation parameter.
     *
     * @param image Original image provided by the user
     * @param originalFileType File type of the image that was provided
     *
     * @returns An Observable containing either the original image if the orientation
     *          value is 1 or the modified image if the orientation is not 1.
     */
    public getOrientedImage(
        image: HTMLImageElement | Blob | File | ArrayBuffer | string,
        originalFileType: string
    ): Observable<HTMLImageElement> {
        return Observable.create((observer: any) => {
            if (!image) {
                observer.error(new Error(this.invalidImageFormatProvided));
                return;
            }

            const exifService = new ExifService();
            exifService.fileType(originalFileType);

            exifService.getData(image).subscribe(
                (imageData: ImageElement) => {
                    const imageOrientation = exifService.getTag(imageData, "Orientation");

                    // if the orientation is set to 1, exit because we do not
                    // need to do anything with the image as it is already in
                    // the proper orientation
                    if (!imageOrientation || imageOrientation === 1) {
                        observer.next(imageData);
                        return;
                    }

                    let width = imageData.width;
                    if (width === 0 && imageData.exif.ImageWidth > 0) {
                        width = imageData.exif.ImageWidth;
                        imageData.width = width;
                    }

                    let height = imageData.height;
                    if (height === 0 && imageData.exif.ImageHeight > 0) {
                        height = imageData.exif.ImageHeight;
                        imageData.height = height;
                    }

                    const destinationParameters = this.destinationParameters(imageOrientation, width, height);
                    this.modifyImage(destinationParameters, imageData, originalFileType).subscribe(
                        (modifiedImage: HTMLImageElement) => {
                            // Return the modified image
                            observer.next(modifiedImage);
                        },
                        (error: any) => {
                            observer.error(new Error(error));
                        }
                    );
                },
                (error: any) => {
                    observer.error(new Error(error));
                }
            );
        });
    }

    /**
     * Determine the parameters to use for the destination canvas so that images
     * are not rotated horizontally when taking a photo on a mobile device.
     *
     * @param imageOrientation The orientation of the image as extracted from the EXIF data
     * @param width Original width of the provided image
     * @param height Original height of the provided image
     *
     * @return Canvas destination values
     */
    private destinationParameters(imageOrientation: number, width: number, height: number): DestinationParameters {
        let destinationX      = 0;
        let destinationY      = 0;
        let destinationWidth  = width;
        let destinationHeight = height;
        let rotationDegree    = 0;

        switch(imageOrientation) {
            case 3:
            case 4:
                destinationX   = -width;
                destinationY   = -height;
                rotationDegree = 180;
                break;
            case 5:
            case 6:
                destinationWidth  = height;
                destinationHeight = width;
                destinationY      = -height;
                rotationDegree    = 90;
                break;
            case 7:
            case 8:
                destinationWidth  = height;
                destinationHeight = width;
                destinationX      = -width;
                rotationDegree    = 270;
                break;
            default:
                break;
        }

        return {
            x: destinationX,
            y: destinationY,
            width: destinationWidth,
            height: destinationHeight,
            rotationDegree,
            imageOrientation
        }
    }

    /**
     * Check the image orientation and modify the image if necessary
     *
     * @param destinationParameters Parameters to use for the new image. i.e. height, width, rotation, etc.
     * @param image The image to be modified
     * @param originalFileType File type of the image that was provided
     *
     * @returns A new Image that has been rotated so that it appears in portait mode rather than landscape
     */
    private modifyImage(
        destinationParameters: DestinationParameters,
        image: HTMLImageElement,
        fileType: string
    ): Observable<HTMLImageElement> {
        return Observable.create((observer: any) => {
            const rotateCanvas: HTMLCanvasElement = document.createElement("canvas");
            const rotateContext: CanvasRenderingContext2D = rotateCanvas.getContext('2d') as CanvasRenderingContext2D;

            rotateCanvas.width  = destinationParameters.width;
            rotateCanvas.height = destinationParameters.height;

            if (rotateContext) {
                if ([2, 4, 5, 7].indexOf(destinationParameters.imageOrientation) > -1) {
                    // flip image
                    rotateContext.translate(destinationParameters.width, 0);
                    rotateContext.scale(-1, 1);
                }

                // Rotate the image as necessary by converting degrees to radians.
                // The rotationDegree should only be set to something other than 0
                // when the image provided is from a mobile device.
                rotateContext.rotate(destinationParameters.rotationDegree * Math.PI / 180);
                rotateContext.drawImage(image, destinationParameters.x, destinationParameters.y);

                const modifiedImage  = new Image();
                modifiedImage.width  = destinationParameters.width;
                modifiedImage.height = destinationParameters.height;
                modifiedImage.onload = () => {
                    observer.next(modifiedImage);
                }
                modifiedImage.src = rotateCanvas.toDataURL(fileType, 1);
            } else {
                observer.next(image);
            }
        });
    }
}
