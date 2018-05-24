import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';

export interface ImageElement extends HTMLImageElement {
    exif: any;
    iptc: any;
    xmp: any
}

@Injectable()
export class ExifService {
    /**
     * Private variables
     */
    private _debug = false;
    private _isXmpEnabled = false;
    private _fileType = 'image/jpg';
    private _errorMessage = {
        imageFailedToLoad: 'Could not load image',
        invalidImageFormat: 'Invalid image format provided'
    }

    /**
     * Public variables
     */
    public exifTags: any = {
        // version tags
        0x9000: 'ExifVersion', // EXIF version
        0xA000: 'FlashpixVersion', // Flashpix format version

        // colorspace tags
        0xA001: 'ColorSpace', // Color space information tag

        // image configuration
        0xA002: 'PixelXDimension', // Valid width of meaningful image
        0xA003: 'PixelYDimension', // Valid height of meaningful image
        0x9101: 'ComponentsConfiguration', // Information about channels
        0x9102: 'CompressedBitsPerPixel', // Compressed bits per pixel

        // user information
        0x927C: 'MakerNote', // Any desired information written by the manufacturer
        0x9286: 'UserComment', // Comments by user

        // related file
        0xA004: 'RelatedSoundFile', // Name of related sound file

        // date and time
        0x9003: 'DateTimeOriginal', // Date and time when the original image was generated
        0x9004: 'DateTimeDigitized', // Date and time when the image was stored digitally
        0x9290: 'SubsecTime', // Fractions of seconds for DateTime
        0x9291: 'SubsecTimeOriginal', // Fractions of seconds for DateTimeOriginal
        0x9292: 'SubsecTimeDigitized', // Fractions of seconds for DateTimeDigitized

        // picture-taking conditions
        0x829A: 'ExposureTime', // Exposure time (in seconds)
        0x829D: 'FNumber', // F number
        0x8822: 'ExposureProgram', // Exposure program
        0x8824: 'SpectralSensitivity', // Spectral sensitivity
        0x8827: 'ISOSpeedRatings', // ISO speed rating
        0x8828: 'OECF', // Optoelectric conversion factor
        0x9201: 'ShutterSpeedValue', // Shutter speed
        0x9202: 'ApertureValue', // Lens aperture
        0x9203: 'BrightnessValue', // Value of brightness
        0x9204: 'ExposureBias', // Exposure bias
        0x9205: 'MaxApertureValue', // Smallest F number of lens
        0x9206: 'SubjectDistance', // Distance to subject in meters
        0x9207: 'MeteringMode', // Metering mode
        0x9208: 'LightSource', // Kind of light source
        0x9209: 'Flash', // Flash status
        0x9214: 'SubjectArea', // Location and area of main subject
        0x920A: 'FocalLength', // Focal length of the lens in mm
        0xA20B: 'FlashEnergy', // Strobe energy in BCPS
        0xA20C: 'SpatialFrequencyResponse', //
        0xA20E: 'FocalPlaneXResolution', // Number of pixels in width direction per FocalPlaneResolutionUnit
        0xA20F: 'FocalPlaneYResolution', // Number of pixels in height direction per FocalPlaneResolutionUnit
        0xA210: 'FocalPlaneResolutionUnit', // Unit for measuring FocalPlaneXResolution and FocalPlaneYResolution
        0xA214: 'SubjectLocation', // Location of subject in image
        0xA215: 'ExposureIndex', // Exposure index selected on camera
        0xA217: 'SensingMethod', // Image sensor type
        0xA300: 'FileSource', // Image source (3 == DSC)
        0xA301: 'SceneType', // Scene type (1 == directly photographed)
        0xA302: 'CFAPattern', // Color filter array geometric pattern
        0xA401: 'CustomRendered', // Special processing
        0xA402: 'ExposureMode', // Exposure mode
        0xA403: 'WhiteBalance', // 1 = auto white balance, 2 = manual
        0xA404: 'DigitalZoomRation', // Digital zoom ratio
        0xA405: 'FocalLengthIn35mmFilm', // Equivalent foacl length assuming 35mm film camera (in mm)
        0xA406: 'SceneCaptureType', // Type of scene
        0xA407: 'GainControl', // Degree of overall image gain adjustment
        0xA408: 'Contrast', // Direction of contrast processing applied by camera
        0xA409: 'Saturation', // Direction of saturation processing applied by camera
        0xA40A: 'Sharpness', // Direction of sharpness processing applied by camera
        0xA40B: 'DeviceSettingDescription', //
        0xA40C: 'SubjectDistanceRange', // Distance to subject

        // other tags
        0xA005: 'InteroperabilityIFDPointer',
        0xA420: 'ImageUniqueID' // Identifier assigned uniquely to each image
    };

    public tiffTags: any = {
        0x0100: 'ImageWidth',
        0x0101: 'ImageHeight',
        0x8769: 'ExifIFDPointer',
        0x8825: 'GPSInfoIFDPointer',
        0xA005: 'InteroperabilityIFDPointer',
        0x0102: 'BitsPerSample',
        0x0103: 'Compression',
        0x0106: 'PhotometricInterpretation',
        0x0112: 'Orientation',
        0x0115: 'SamplesPerPixel',
        0x011C: 'PlanarConfiguration',
        0x0212: 'YCbCrSubSampling',
        0x0213: 'YCbCrPositioning',
        0x011A: 'XResolution',
        0x011B: 'YResolution',
        0x0128: 'ResolutionUnit',
        0x0111: 'StripOffsets',
        0x0116: 'RowsPerStrip',
        0x0117: 'StripByteCounts',
        0x0201: 'JPEGInterchangeFormat',
        0x0202: 'JPEGInterchangeFormatLength',
        0x012D: 'TransferFunction',
        0x013E: 'WhitePoint',
        0x013F: 'PrimaryChromaticities',
        0x0211: 'YCbCrCoefficients',
        0x0214: 'ReferenceBlackWhite',
        0x0132: 'DateTime',
        0x010E: 'ImageDescription',
        0x010F: 'Make',
        0x0110: 'Model',
        0x0131: 'Software',
        0x013B: 'Artist',
        0x8298: 'Copyright'
    };

    public gpsTags: any = {
        0x0000: 'GPSVersionID',
        0x0001: 'GPSLatitudeRef',
        0x0002: 'GPSLatitude',
        0x0003: 'GPSLongitudeRef',
        0x0004: 'GPSLongitude',
        0x0005: 'GPSAltitudeRef',
        0x0006: 'GPSAltitude',
        0x0007: 'GPSTimeStamp',
        0x0008: 'GPSSatellites',
        0x0009: 'GPSStatus',
        0x000A: 'GPSMeasureMode',
        0x000B: 'GPSDOP',
        0x000C: 'GPSSpeedRef',
        0x000D: 'GPSSpeed',
        0x000E: 'GPSTrackRef',
        0x000F: 'GPSTrack',
        0x0010: 'GPSImgDirectionRef',
        0x0011: 'GPSImgDirection',
        0x0012: 'GPSMapDatum',
        0x0013: 'GPSDestLatitudeRef',
        0x0014: 'GPSDestLatitude',
        0x0015: 'GPSDestLongitudeRef',
        0x0016: 'GPSDestLongitude',
        0x0017: 'GPSDestBearingRef',
        0x0018: 'GPSDestBearing',
        0x0019: 'GPSDestDistanceRef',
        0x001A: 'GPSDestDistance',
        0x001B: 'GPSProcessingMethod',
        0x001C: 'GPSAreaInformation',
        0x001D: 'GPSDateStamp',
        0x001E: 'GPSDifferential',
        0x001F: 'GPSHPositioningError'
    };

    /**
     * EXIF 2.3 Spec
     */
    public ifd1Tags: any = {
        0x0100: 'ImageWidth',
        0x0101: 'ImageHeight',
        0x0102: 'BitsPerSample',
        0x0103: 'Compression',
        0x0106: 'PhotometricInterpretation',
        0x0111: 'StripOffsets',
        0x0112: 'Orientation',
        0x0115: 'SamplesPerPixel',
        0x0116: 'RowsPerStrip',
        0x0117: 'StripByteCounts',
        0x011A: 'XResolution',
        0x011B: 'YResolution',
        0x011C: 'PlanarConfiguration',
        0x0128: 'ResolutionUnit',
        0x0201: 'JpegIFOffset', // When image format is JPEG, this value show offset to JPEG data stored.(aka 'ThumbnailOffset' or 'JPEGInterchangeFormat')
        0x0202: 'JpegIFByteCount', // When image format is JPEG, this value shows data size of JPEG image (aka 'ThumbnailLength' or 'JPEGInterchangeFormatLength')
        0x0211: 'YCbCrCoefficients',
        0x0212: 'YCbCrSubSampling',
        0x0213: 'YCbCrPositioning',
        0x0214: 'ReferenceBlackWhite'
    };

    public stringValues: any = {
        ExposureProgram: {
            0: 'Not defined',
            1: 'Manual',
            2: 'Normal program',
            3: 'Aperture priority',
            4: 'Shutter priority',
            5: 'Creative program',
            6: 'Action program',
            7: 'Portrait mode',
            8: 'Landscape mode'
        },
        MeteringMode: {
            0: 'Unknown',
            1: 'Average',
            2: 'CenterWeightedAverage',
            3: 'Spot',
            4: 'MultiSpot',
            5: 'Pattern',
            6: 'Partial',
            255: 'Other'
        },
        LightSource: {
            0: 'Unknown',
            1: 'Daylight',
            2: 'Fluorescent',
            3: 'Tungsten (incandescent light)',
            4: 'Flash',
            9: 'Fine weather',
            10: 'Cloudy weather',
            11: 'Shade',
            12: 'Daylight fluorescent (D 5700 - 7100K)',
            13: 'Day white fluorescent (N 4600 - 5400K)',
            14: 'Cool white fluorescent (W 3900 - 4500K)',
            15: 'White fluorescent (WW 3200 - 3700K)',
            17: 'Standard light A',
            18: 'Standard light B',
            19: 'Standard light C',
            20: 'D55',
            21: 'D65',
            22: 'D75',
            23: 'D50',
            24: 'ISO studio tungsten',
            255: 'Other'
        },
        Flash: {
            0x0000: 'Flash did not fire',
            0x0001: 'Flash fired',
            0x0005: 'Strobe return light not detected',
            0x0007: 'Strobe return light detected',
            0x0009: 'Flash fired, compulsory flash mode',
            0x000D: 'Flash fired, compulsory flash mode, return light not detected',
            0x000F: 'Flash fired, compulsory flash mode, return light detected',
            0x0010: 'Flash did not fire, compulsory flash mode',
            0x0018: 'Flash did not fire, auto mode',
            0x0019: 'Flash fired, auto mode',
            0x001D: 'Flash fired, auto mode, return light not detected',
            0x001F: 'Flash fired, auto mode, return light detected',
            0x0020: 'No flash function',
            0x0041: 'Flash fired, red-eye reduction mode',
            0x0045: 'Flash fired, red-eye reduction mode, return light not detected',
            0x0047: 'Flash fired, red-eye reduction mode, return light detected',
            0x0049: 'Flash fired, compulsory flash mode, red-eye reduction mode',
            0x004D: 'Flash fired, compulsory flash mode, red-eye reduction mode, return light not detected',
            0x004F: 'Flash fired, compulsory flash mode, red-eye reduction mode, return light detected',
            0x0059: 'Flash fired, auto mode, red-eye reduction mode',
            0x005D: 'Flash fired, auto mode, return light not detected, red-eye reduction mode',
            0x005F: 'Flash fired, auto mode, return light detected, red-eye reduction mode'
        },
        SensingMethod: {
            1: 'Not defined',
            2: 'One-chip color area sensor',
            3: 'Two-chip color area sensor',
            4: 'Three-chip color area sensor',
            5: 'Color sequential area sensor',
            7: 'Trilinear sensor',
            8: 'Color sequential linear sensor'
        },
        SceneCaptureType: {
            0: 'Standard',
            1: 'Landscape',
            2: 'Portrait',
            3: 'Night scene'
        },
        SceneType: {
            1: 'Directly photographed'
        },
        CustomRendered: {
            0: 'Normal process',
            1: 'Custom process'
        },
        WhiteBalance: {
            0: 'Auto white balance',
            1: 'Manual white balance'
        },
        GainControl: {
            0: 'None',
            1: 'Low gain up',
            2: 'High gain up',
            3: 'Low gain down',
            4: 'High gain down'
        },
        Contrast: {
            0: 'Normal',
            1: 'Soft',
            2: 'Hard'
        },
        Saturation: {
            0: 'Normal',
            1: 'Low saturation',
            2: 'High saturation'
        },
        Sharpness: {
            0: 'Normal',
            1: 'Soft',
            2: 'Hard'
        },
        SubjectDistanceRange: {
            0: 'Unknown',
            1: 'Macro',
            2: 'Close view',
            3: 'Distant view'
        },
        FileSource: {
            3: 'DSC'
        },

        Components: {
            0: '',
            1: 'Y',
            2: 'Cb',
            3: 'Cr',
            4: 'R',
            5: 'G',
            6: 'B'
        }
    };

    public iptcFieldMap: any = {
        0x78: 'caption',
        0x6E: 'credit',
        0x16: 'fixtureID',
        0x19: 'keywords',
        0x37: 'dateCreated',
        0x50: 'byline',
        0x55: 'bylineTitle',
        0x7A: 'captionWriter',
        0x69: 'headline',
        0x74: 'copyright',
        0x0F: 'category'
    };

    /*
     * public properties
     */
    public enableXmp() {
        this._isXmpEnabled = true;
    }

    public disableXmp() {
        this._isXmpEnabled = false;
    }

    public fileType(imageFormat: string) {
        this._fileType = imageFormat;
    }

    /*
     * Constructor
     */
    public constructor() {

    }

    /*
     * Public Functions
     */
    public getData(image: HTMLImageElement | Blob | File | ArrayBuffer | string): Observable<ImageElement> {
        return Observable.create((observer: any) => {
            this.getImageData(image).subscribe(
                (image: ImageElement) => {
                    observer.next(image);
                },
                (error: any) => {
                    observer.error(error);
                }
            );
        });
    }

    public getTag(imageData: ImageElement, tag: string): any {
        if (!this.imageHasData(imageData)) {
            return;
        }

        return imageData.exif[tag];
    }

    public getIptcTag(imageData: ImageElement, tag: string): any {
        if (!this.imageHasData(imageData)) {
            return;
        }

        return imageData.iptc[tag];
    }

    public getAllTags(imageData: ImageElement): any {
        if (!this.imageHasData(imageData)) {
            return {};
        }

        let a: string;
        let data: any = imageData.exif;
        let tags: any = {};

        for (a in data) {
            if (data.hasOwnProperty(a)) {
                tags[a] = data[a];
            }
        }

        return tags;
    }

    public getAllIptcTags(imageData: ImageElement): any {
        if (!this.imageHasData(imageData)) {
            return {};
        }

        let a: string;
        let data: any = imageData.iptc;
        let tags: any = {};

        for (a in data) {
            if (data.hasOwnProperty(a)) {
                tags[a] = data[a];
            }
        }

        return tags;
    }

    public pretty(imageData: ImageElement): string {
        if (!this.imageHasData(imageData)) {
            return '';
        }

        let a: any;
        let data: any = imageData.exif;
        let prettyString = '';

        for (a in data) {
            if (data.hasOwnProperty(a)) {
                if (typeof data[a] === 'object') {
                    if (data[a] instanceof Number) {
                        prettyString += `${a} : ${data[a]} [${data[a].numerator}/${data[a].denominator}]\r\n`;
                    } else {
                        prettyString += `${a} : [${data[a].length} values]\r\n`;
                    }
                } else {
                    prettyString += `${a} : ${data[a]}\r\n`;
                }
            }
        }

        return prettyString;
    }

    /*
     * Private Functions
     */
    private getImageData(image: HTMLImageElement | Blob | File | ArrayBuffer | string): Observable<ImageElement> {
        return Observable.create((observer: any) => {
            // If the image value provided is a Blob or File then use the file reader
            // to convert the image to an ArrayBuffer so we can extract the Exif, IPTC, XMP data
            if (FileReader && (image instanceof Blob || image instanceof File)) {
                let reader = new FileReader();
                reader.onload = (event: any) => {
                    const binaryFile = event.target.result;
                    let imageData: ImageElement = this.findAndSetImageTagData(binaryFile);
                    imageData.onload = () => {
                        observer.next(imageData);
                    }
                    imageData = this.addImageSourceFromArrayBuffer(imageData, binaryFile);
                };

                if (image instanceof Blob) {
                    reader.readAsArrayBuffer(image);
                } else {
                    reader.readAsDataURL(image);
                }
            } else if (image instanceof ArrayBuffer) {
                let imageData: ImageElement = this.findAndSetImageTagData(image);
                imageData.onload = () => {
                    observer.next(imageData);
                }
                imageData = this.addImageSourceFromArrayBuffer(imageData, image);
            } else if (image instanceof HTMLImageElement) {
                const imageSource = image.src;
                // it take a long time to test the entire image string with
                // the initial regex and the "data" portion we are testing for
                // is always at the beginning so let's trim the string and only
                // test what needs to be tested.
                const fileToTest = imageSource.slice(0, 25);

                if (/^data\:/i.test(fileToTest)) { // Data URI
                    let arrayBuffer: ArrayBuffer = this.base64ToArrayBuffer(imageSource);
                    let imageData: ImageElement  = this.findAndSetImageTagData(arrayBuffer);
                    imageData.onload = () => {
                        observer.next(imageData);
                    }
                    imageData = this.addImageSource(imageData, imageSource);
                } else if (/^blob\:/i.test(fileToTest)) { // Object URL
                    let fileReader = new FileReader();

                    fileReader.onload = (event: any) => {
                        const binaryFile = event.target.result;
                        let imageData: ImageElement = this.findAndSetImageTagData(binaryFile);
                        imageData.onload = () => {
                            observer.next(imageData);
                        }
                        imageData = this.addImageSourceFromArrayBuffer(imageData, binaryFile);
                    };

                    this.objectURLToBlob(imageSource, (blob: Blob) => {
                        fileReader.readAsArrayBuffer(blob);
                    });
                } else {
                    let http: XMLHttpRequest = new XMLHttpRequest();

                    http.onload = () => {
                        if (http.status == 200 || http.status === 0) {
                            const binaryFile = http.response;
                            let imageData: ImageElement = this.findAndSetImageTagData(binaryFile);
                            imageData.onload = () => {
                                observer.next(imageData);
                            }
                            imageData = this.addImageSourceFromArrayBuffer(imageData, binaryFile);
                        } else {
                            observer.error(this._errorMessage.imageFailedToLoad);
                        }
                    };

                    http.open('GET', imageSource, true);
                    http.responseType = 'arraybuffer';
                    http.send(null);
                }
            } else {
                const imageSource = (image as string);
                const stringToTest = imageSource.slice(0, 25);
                if (/^data\:/i.test(stringToTest)) { // Data URI
                    let arrayBuffer: ArrayBuffer = this.base64ToArrayBuffer(imageSource);
                    let imageData: ImageElement  = this.findAndSetImageTagData(arrayBuffer);
                    imageData.onload = () => {
                        observer.next(imageData);
                    }
                    imageData = this.addImageSource(imageData, imageSource);
                } else {
                    observer.error(this._errorMessage.invalidImageFormat);
                }
            }
        });
    }

    private findAndSetImageTagData(binaryFile: ArrayBuffer): ImageElement {
        const exifData = this.findEXIFinJPEG(binaryFile);
        const iptcData = this.findIPTCinJPEG(binaryFile);
        let xmpdata    = {};

        let image = new Image();
        let data: ImageElement = (image as ImageElement);

        data.exif = exifData || {};
        data.iptc = iptcData || {};

        if (this._isXmpEnabled) {
            data.xmp = this.findXMPinJPEG(binaryFile);
        }

        return data;
    }

    private addImageSourceFromArrayBuffer(data: ImageElement, binaryFile: ArrayBuffer): ImageElement {
        const base64Image       = this.arrayBufferToBase64(binaryFile);
        const properBase64Image = `data:${this._fileType};base64,${base64Image}`;
        return this.addImageSource(data, properBase64Image);
    }

    private addImageSource(data: ImageElement, imageString: string): ImageElement {
        data.src = imageString;
        return data;
    }

    /**
     * Convert the ArrayBuffer to a base 64 string
     *
     * @param buffer ArrayBuffer returned from the file reader
     *
     * @return A base64 string of the provided image
     */
    private arrayBufferToBase64(buffer: any): string {
        let binary   = '';
        const bytes  = new Uint8Array(buffer);
        const length = bytes.byteLength;

        for (let i = 0; i < length; i++) {
            binary += String.fromCharCode(bytes[i]);
        }

        return window.btoa(binary);
    }

    private base64ToArrayBuffer(base64: string): ArrayBuffer {
        base64 = base64.replace(/^data\:([^\;]+)\;base64,/gmi, '');

        let binary = atob(base64);
        let len    = binary.length;
        let buffer = new ArrayBuffer(len);
        let view   = new Uint8Array(buffer);

        for (let i = 0; i < len; i++) {
            view[i] = binary.charCodeAt(i);
        }

        return buffer;
    }

    private objectURLToBlob(url: string, callback: Function) {
        let http = new XMLHttpRequest();
        http.open('GET', url, true);
        http.responseType = 'blob';

        http.onload = () => {
            if (http.status == 200 || http.status === 0) {
                callback(http.response);
            }
        };

        http.send();
    }

    private findEXIFinJPEG(file: ArrayBuffer): any {
        let dataView = new DataView(file);

        this.log(`Got file of length ${file.byteLength}`);

        if ((dataView.getUint8(0) != 0xFF) || (dataView.getUint8(1) != 0xD8)) {
            this.log('Not a valid JPEG');
            return false; // not a valid jpeg
        }

        let offset = 2;
        let length: number = file.byteLength;
        let marker: number;

        while (offset < length) {
            if (dataView.getUint8(offset) != 0xFF) {
                this.log(`Not a valid marker at offset ${offset}, found: ${dataView.getUint8(offset)}`);
                return false; // not a valid marker, something is wrong
            }

            marker = dataView.getUint8(offset + 1);
            this.log(marker);

            // we could implement handling for other markers here,
            // but we're only looking for 0xFFE1 for EXIF data
            if (marker == 225) {
                this.log('Found 0xFFE1 marker');
                return this.readEXIFData(dataView, offset + 4);
            } else {
                offset += 2 + dataView.getUint16(offset + 2);
            }
        }
    }

    private findIPTCinJPEG(file: ArrayBuffer): any {
        let dataView = new DataView(file);

        this.log(`Got file of length ${file.byteLength}`);

        if ((dataView.getUint8(0) != 0xFF) || (dataView.getUint8(1) != 0xD8)) {
            this.log('Not a valid JPEG');
            return false; // not a valid jpeg
        }

        let offset = 2;
        let length = file.byteLength;

        let isFieldSegmentStart = (view: DataView, _offset: number) => {
            return (
                view.getUint8(_offset) === 0x38 &&
                view.getUint8(_offset + 1) === 0x42 &&
                view.getUint8(_offset + 2) === 0x49 &&
                view.getUint8(_offset + 3) === 0x4D &&
                view.getUint8(_offset + 4) === 0x04 &&
                view.getUint8(_offset + 5) === 0x04
            );
        };

        while (offset < length) {
            if (isFieldSegmentStart(dataView, offset)) {
                // Get the length of the name header (which is padded to an even number of bytes)
                let nameHeaderLength = dataView.getUint8(offset + 7);
                if (nameHeaderLength % 2 !== 0) {
                    nameHeaderLength += 1;
                }

                // Check for pre photoshop 6 format
                if (nameHeaderLength === 0) {
                    // Always 4
                    nameHeaderLength = 4;
                }

                let startOffset   = offset + 8 + nameHeaderLength;
                let sectionLength = dataView.getUint16(offset + 6 + nameHeaderLength);

                return this.readIPTCData(file, startOffset, sectionLength);
            }

            // Not the marker, continue searching
            offset++;
        }
    }

    private readIPTCData(file: ArrayBuffer, startOffset: number, sectionLength: number) {
      let dataView = new DataView(file);
      let data: any = {};
      let fieldValue: any, fieldName: string, dataSize: number, segmentType: any, segmentSize: number;
      let segmentStartPos = startOffset;

      while (segmentStartPos < startOffset + sectionLength) {
        if (dataView.getUint8(segmentStartPos) === 0x1C && dataView.getUint8(segmentStartPos + 1) === 0x02) {
            segmentType = dataView.getUint8(segmentStartPos + 2);

            if (segmentType in this.iptcFieldMap) {
                dataSize    = dataView.getInt16(segmentStartPos + 3);
                segmentSize = dataSize + 5;
                fieldName   = this.iptcFieldMap[segmentType];
                fieldValue  = this.getStringFromDB(dataView, segmentStartPos + 5, dataSize);

                // Check if we already stored a value with this name
                if (data.hasOwnProperty(fieldName)) {
                    // Value already stored with this name, create multivalue field
                    if (data[fieldName] instanceof Array) {
                        data[fieldName].push(fieldValue);
                    } else {
                        data[fieldName] = [data[fieldName], fieldValue];
                    }
                } else {
                    data[fieldName] = fieldValue;
                }
            }
        }

        segmentStartPos++;
      }

      return data;
    }

    private readTags(file: DataView, tiffStart: number, dirStart: number, strings: string[], bigEnd: boolean): Object {
        let entries: number = file.getUint16(dirStart, !bigEnd);
        let tags: any = {};
        let entryOffset: number;
        let tag: string;

        for (let i = 0; i < entries; i++) {
            entryOffset = dirStart + i * 12 + 2;
            tag         = strings[file.getUint16(entryOffset, !bigEnd)];

            if (!tag) {
                this.log('Unknown tag: ' + file.getUint16(entryOffset, !bigEnd));
            }

            tags[tag] = this.readTagValue(file, entryOffset, tiffStart, dirStart, bigEnd);
        }

        return tags;
    }

    private readTagValue(file: any, entryOffset: number, tiffStart: number, dirStart: number, bigEnd: boolean): any {
        let type: number        = file.getUint16(entryOffset + 2, !bigEnd);
        let numValues: number   = file.getUint32(entryOffset + 4, !bigEnd);
        let valueOffset: number = file.getUint32(entryOffset + 8, !bigEnd) + tiffStart;

        let offset: number;
        let vals: any[], val: any, n: number;
        let numerator: any;
        let denominator: any;

        switch (type) {
            case 1: // byte, 8-bit unsigned int
            case 7: // undefined, 8-bit byte, value depending on field
                if (numValues === 1) {
                    return file.getUint8(entryOffset + 8, !bigEnd);
                } else {
                    offset = numValues > 4 ? valueOffset : (entryOffset + 8);
                    vals = [];
                    for (n = 0; n < numValues; n++) {
                        vals[n] = file.getUint8(offset + n);
                    }
                    return vals;
                }

            case 2: // ascii, 8-bit byte
                offset = numValues > 4 ? valueOffset : (entryOffset + 8);
                return this.getStringFromDB(file, offset, numValues - 1);

            case 3: // short, 16 bit int
                if (numValues === 1) {
                    return file.getUint16(entryOffset + 8, !bigEnd);
                } else {
                    offset = numValues > 2 ? valueOffset : (entryOffset + 8);
                    vals = [];
                    for (n = 0; n < numValues; n++) {
                        vals[n] = file.getUint16(offset + 2 * n, !bigEnd);
                    }
                    return vals;
                }

            case 4: // long, 32 bit int
                if (numValues === 1) {
                    return file.getUint32(entryOffset + 8, !bigEnd);
                } else {
                    vals = [];
                    for (n = 0; n < numValues; n++) {
                        vals[n] = file.getUint32(valueOffset + 4 * n, !bigEnd);
                    }
                    return vals;
                }

            case 5:    // rational = two long values, first is numerator, second is denominator
                if (numValues === 1) {
                    numerator   = file.getUint32(valueOffset, !bigEnd);
                    denominator = file.getUint32(valueOffset + 4, !bigEnd);

                    return {
                        numerator,
                        denominator,
                        value: numerator / denominator
                    };
                } else {
                    vals = [];

                    for (n = 0; n < numValues; n++) {
                        numerator   = file.getUint32(valueOffset + 8 * n, !bigEnd);
                        denominator = file.getUint32(valueOffset + 4 + 8 * n, !bigEnd);

                        vals[n] = {
                            numerator,
                            denominator,
                            value: numerator / denominator
                        };
                    }

                    return vals;
                }

            case 9: // slong, 32 bit signed int
                if (numValues === 1) {
                    return file.getInt32(entryOffset + 8, !bigEnd);
                } else {
                    vals = [];

                    for (n = 0; n < numValues; n++) {
                        vals[n] = file.getInt32(valueOffset + 4 * n, !bigEnd);
                    }

                    return vals;
                }

            case 10: // signed rational, two slongs, first is numerator, second is denominator
                if (numValues === 1) {
                    let numerator   = file.getInt32(valueOffset, !bigEnd);
                    let denominator = file.getInt32(valueOffset + 4, !bigEnd);
                    return numerator / denominator;
                } else {
                    vals = [];

                    for (n = 0; n < numValues; n++) {
                        let numerator   = file.getInt32(valueOffset + 8 * n, !bigEnd);
                        let denominator = file.getInt32(valueOffset + 4 + 8 * n, !bigEnd);
                        vals[n] = numerator / denominator;
                    }

                    return vals;
                }
            default:
                break;
        }
    }

    private readThumbnailImage(dataView: DataView, tiffStart: number, firstIFDOffset: any, bigEnd: boolean) {
        // get the IFD1 offset
        let IFD1OffsetPointer = this.getNextIFDOffset(dataView, tiffStart + firstIFDOffset, bigEnd);

        if (!IFD1OffsetPointer) {
            return {};
        } else if (IFD1OffsetPointer > dataView.byteLength) {
            // this should not happen
            return {};
        }

        let thumbTags: any = this.readTags(dataView, tiffStart, tiffStart + IFD1OffsetPointer, this.ifd1Tags, bigEnd);

        // EXIF 2.3 specification for JPEG format thumbnail

        // If the value of Compression(0x0103) Tag in IFD1 is '6', thumbnail image format is JPEG.
        // Most of Exif image uses JPEG format for thumbnail. In that case, you can get offset of thumbnail
        // by JpegIFOffset(0x0201) Tag in IFD1, size of thumbnail by JpegIFByteCount(0x0202) Tag.
        // Data format is ordinary JPEG format, starts from 0xFFD8 and ends by 0xFFD9. It seems that
        // JPEG format and 160x120pixels of size are recommended thumbnail format for Exif2.1 or later.

        if (thumbTags['Compression']) {
            switch (thumbTags['Compression']) {
                case 6:
                    if (thumbTags['JpegIFOffset'] && thumbTags['JpegIFByteCount']) {
                        // extract the thumbnail
                        let tOffset = tiffStart + thumbTags['JpegIFOffset'];
                        let tLength = thumbTags['JpegIFByteCount'];

                        thumbTags['blob'] = new Blob([new Uint8Array(dataView.buffer, tOffset, tLength)], {
                            type: 'image/jpeg'
                        });
                    }
                    break;

                case 1:
                    this.log('Thumbnail image format is TIFF, which is not implemented.');
                    break;

                default:
                    this.log(`Unknown thumbnail image format: ${thumbTags['Compression']}`);
            }
        } else if (thumbTags['PhotometricInterpretation'] == 2) {
            this.log('Thumbnail image format is RGB, which is not implemented.');
        }

        return thumbTags;
    }

    /**
     * Given an IFD (Image File Directory) start offset
     * returns an offset to next IFD or 0 if it's the last IFD.
     */
    private getNextIFDOffset(dataView: DataView, dirStart: number, bigEnd: boolean) {
        //the first 2bytes means the number of directory entries contains in this IFD
        let entries = dataView.getUint16(dirStart, !bigEnd);

        // After last directory entry, there is a 4bytes of data,
        // it means an offset to next IFD.
        // If its value is '0x00000000', it means this is the last IFD and there is no linked IFD.

        return dataView.getUint32(dirStart + 2 + entries * 12, !bigEnd); // each entry is 12 bytes long
    }

    private readEXIFData(file: DataView, start: number): any {
        if (this.getStringFromDB(file, start, 4) != 'Exif') {
            this.log(`Not valid EXIF data! ${this.getStringFromDB(file, start, 4)}`);

            return false;
        }

        let bigEnd: boolean, tags: any, tag: string, exifData: any, gpsData: any;
        let tiffOffset: number = start + 6;

        // test for TIFF validity and endianness
        if (file.getUint16(tiffOffset) == 0x4949) {
            bigEnd = false;
        } else if (file.getUint16(tiffOffset) == 0x4D4D) {
            bigEnd = true;
        } else {
            this.log('Not valid TIFF data! (no 0x4949 or 0x4D4D)');
            return false;
        }

        if (file.getUint16(tiffOffset + 2, !bigEnd) != 0x002A) {
            this.log('Not valid TIFF data! (no 0x002A)');
            return false;
        }

        let firstIFDOffset = file.getUint32(tiffOffset + 4, !bigEnd);

        if (firstIFDOffset < 0x00000008) {
            this.log('Not valid TIFF data! (First offset less than 8)', file.getUint32(tiffOffset + 4, !bigEnd));
            return false;
        }

        tags = this.readTags(file, tiffOffset, tiffOffset + firstIFDOffset, this.tiffTags, bigEnd);

        if (tags.ExifIFDPointer) {
            exifData = this.readTags(file, tiffOffset, tiffOffset + tags.ExifIFDPointer, this.exifTags, bigEnd);

            for (tag in exifData) {
                switch (tag) {
                    case 'LightSource':
                    case 'Flash':
                    case 'MeteringMode':
                    case 'ExposureProgram':
                    case 'SensingMethod':
                    case 'SceneCaptureType':
                    case 'SceneType':
                    case 'CustomRendered':
                    case 'WhiteBalance':
                    case 'GainControl':
                    case 'Contrast':
                    case 'Saturation':
                    case 'Sharpness':
                    case 'SubjectDistanceRange':
                    case 'FileSource':
                        exifData[tag] = this.stringValues[tag][exifData[tag]];
                        break;

                    case 'ExifVersion':
                    case 'FlashpixVersion':
                        exifData[tag] = String.fromCharCode(
                            exifData[tag][0],
                            exifData[tag][1],
                            exifData[tag][2],
                            exifData[tag][3]
                        );
                        break;

                    case 'ComponentsConfiguration':
                        exifData[tag] =
                            this.stringValues.Components[exifData[tag][0]] +
                            this.stringValues.Components[exifData[tag][1]] +
                            this.stringValues.Components[exifData[tag][2]] +
                            this.stringValues.Components[exifData[tag][3]];
                        break;

                    default:
                            break;
                }
                tags[tag] = exifData[tag];
            }
        }

        if (tags.GPSInfoIFDPointer) {
            gpsData = this.readTags(file, tiffOffset, tiffOffset + tags.GPSInfoIFDPointer, this.gpsTags, bigEnd);

            for (tag in gpsData) {
                switch (tag) {
                    case 'GPSVersionID':
                        // Skip broken GPSVersionID - iggfisk
                        // https://github.com/exif-js/exif-js/pull/161
                        if (gpsData[tag]) {
                            gpsData[tag] = `${gpsData[tag][0]}.${gpsData[tag][1]}.${gpsData[tag][2]}.${gpsData[tag][3]}`;
                        }

                        break;

                    default:
                            break;
                }

                tags[tag] = gpsData[tag];
            }
        }

        // extract thumbnail
        tags.thumbnail = this.readThumbnailImage(file, tiffOffset, firstIFDOffset, bigEnd);

        return tags;
    }

    private getStringFromDB(buffer: DataView, start: number, length: number): string {
        let outputString = '';

        for (let n = start; n < start + length; n++) {
            outputString += String.fromCharCode(buffer.getUint8(n));
        }

        return outputString;
    }

    private findXMPinJPEG(file: any): any {
        if (!('DOMParser' in self)) {
            return;
        }

        let dataView = new DataView(file);

        this.log(`Got file of length ${file.byteLength}`);

        if ((dataView.getUint8(0) != 0xFF) || (dataView.getUint8(1) != 0xD8)) {
            this.log('Not a valid JPEG');
            return false; // not a valid jpeg
        }

        let offset = 2;
        let length = file.byteLength;
        let dom = new DOMParser();

        while (offset < (length - 4)) {
            if (this.getStringFromDB(dataView, offset, 4) == 'http') {
                let startOffset   = offset - 1;
                let sectionLength = dataView.getUint16(offset - 2) - 1;
                let xmpString     = this.getStringFromDB(dataView, startOffset, sectionLength);
                let xmpEndIndex   = xmpString.indexOf('xmpmeta>') + 8;

                xmpString = xmpString.substring(xmpString.indexOf('<x:xmpmeta'), xmpEndIndex);

                let indexOfXmp = xmpString.indexOf('x:xmpmeta') + 10;

                // Many custom written programs embed xmp/xml without any namespace. Following are some of them.
                // Without these namespaces, XML is thought to be invalid by parsers
                xmpString = xmpString.slice(0, indexOfXmp)
                            + 'xmlns:Iptc4xmpCore="http://iptc.org/std/Iptc4xmpCore/1.0/xmlns/" '
                            + 'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" '
                            + 'xmlns:tiff="http://ns.adobe.com/tiff/1.0/" '
                            + 'xmlns:plus="http://schemas.android.com/apk/lib/com.google.android.gms.plus" '
                            + 'xmlns:ext="http://www.gettyimages.com/xsltExtension/1.0" '
                            + 'xmlns:exif="http://ns.adobe.com/exif/1.0/" '
                            + 'xmlns:stEvt="http://ns.adobe.com/xap/1.0/sType/ResourceEvent#" '
                            + 'xmlns:stRef="http://ns.adobe.com/xap/1.0/sType/ResourceRef#" '
                            + 'xmlns:crs="http://ns.adobe.com/camera-raw-settings/1.0/" '
                            + 'xmlns:xapGImg="http://ns.adobe.com/xap/1.0/g/img/" '
                            + 'xmlns:Iptc4xmpExt="http://iptc.org/std/Iptc4xmpExt/2008-02-29/" '
                            + xmpString.slice(indexOfXmp);

                let domDocument = dom.parseFromString(xmpString, 'text/xml');
                return this.xml2Object(domDocument);
            } else {
                offset++;
            }
        }
    }

    private xml2json(xml: any): any {
        let json: any = {};

        if (xml.nodeType == 1) { // element node
            if (xml.attributes.length > 0) {
                json['@attributes'] = {};

                for (let j = 0; j < xml.attributes.length; j++) {
                    let attribute = xml.attributes.item(j);
                    json['@attributes'][attribute.nodeName] = attribute.nodeValue;
                }
            }
        } else if (xml.nodeType == 3) { // text node
            return xml.nodeValue;
        }

        // deal with children
        if (xml.hasChildNodes()) {
            for (let i = 0; i < xml.childNodes.length; i++) {
                let child = xml.childNodes.item(i);
                let nodeName = child.nodeName;

                if (json[nodeName] == null) {
                    json[nodeName] = this.xml2json(child);
                } else {
                    if (json[nodeName].push == null) {
                        let old = json[nodeName];
                        json[nodeName] = [];
                        json[nodeName].push(old);
                    }

                    json[nodeName].push(this.xml2json(child));
                }
            }
        }

        return json;
    }

    private xml2Object(xml: any): any {
        let obj: any = {};

        if (xml.children.length > 0) {
            try {
                for (let i = 0; i < xml.children.length; i++) {
                    let item = xml.children.item(i);
                    let attributes = item.attributes;
                    for (let idx in attributes) {
                        let itemAtt = attributes[idx];
                        let dataKey = itemAtt.nodeName;
                        let dataValue = itemAtt.nodeValue;

                        if (dataKey !== undefined) {
                            obj[dataKey] = dataValue;
                        }
                    }
                    let nodeName = item.nodeName;

                    if (typeof (obj[nodeName]) == 'undefined') {
                        obj[nodeName] = this.xml2json(item);
                    } else {
                        if (typeof (obj[nodeName].push) == 'undefined') {
                            let old = obj[nodeName];

                            obj[nodeName] = [];
                            obj[nodeName].push(old);
                        }
                        obj[nodeName].push(this.xml2json(item));
                    }
                }
            } catch (error) {
                this.log(error.message);
            }
        } else {
            obj = xml.textContent;
        }

        return obj;
    }

    private imageHasData(imageData: ImageElement) {
        return !!(imageData.exif);
    }

    private log(...args: any[]) {
        if (this._debug) {
            console.log(args);
        }
    }
}
