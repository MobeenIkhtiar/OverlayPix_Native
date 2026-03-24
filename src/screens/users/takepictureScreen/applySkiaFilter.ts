/**
 * applySkiaFilter.ts
 *
 * Off-screen Skia rendering utility that bakes a filter into image pixel data.
 * Call this before uploading so the saved image matches what the user sees.
 */
import { Skia, TileMode, ImageFormat } from '@shopify/react-native-skia';
import RNFS from 'react-native-fs';
import { getFilterMatrix } from './filterMatrices';

/**
 * Extracts the raw base64 string from a data URI.
 * Returns null if the URI is not a data URI.
 */
const extractBase64 = (uri: string): string | null => {
    const match = uri.match(/^data:[^;]+;base64,(.+)$/);
    return match ? match[1] : null;
};

const internalLoadSkiaImage = async (uri: string) => {
    const base64 = extractBase64(uri);
    if (base64) {
        // For data URIs, use Skia.Data.fromBase64 directly (more reliable on Android)
        const data = Skia.Data.fromBase64(base64);
        return Skia.Image.MakeImageFromEncoded(data);
    }

    try {
        // Try native loading first - orders of magnitude faster as it avoids JS Bridge array buffers
        // fromURI is synchronous in RN Skia JS API but reads from file system/network natively
        const data = await Skia.Data.fromURI(uri);
        const image = Skia.Image.MakeImageFromEncoded(data);
        if (image) return image;
    } catch (e) {
        console.warn('Skia.Data.fromURI failed, falling back to RNFS or fetch', e);
    }

    // Android file:// URI fallback using RNFS base64 string
    // This is much faster than fetch().arrayBuffer() which creates huge JS arrays
    if (uri.startsWith('file://')) {
        try {
            const fileBase64 = await RNFS.readFile(uri, 'base64');
            const data = Skia.Data.fromBase64(fileBase64);
            return Skia.Image.MakeImageFromEncoded(data);
        } catch (fsErr) {
            console.warn('RNFS.readFile failed, falling back to fetch', fsErr);
        }
    }

    // Last resort fallback path
    try {
        const response = await fetch(uri);
        const buffer = await response.arrayBuffer();
        const data = Skia.Data.fromBytes(new Uint8Array(buffer));
        return Skia.Image.MakeImageFromEncoded(data);
    } catch (fetchErr) {
        console.error('Failed to fallback fetch image:', fetchErr);
        return null;
    }
};

const skiaImagePromises = new Map<string, Promise<any>>();

/**
 * Wraps loading into a Promise cache to prevent 11 thumbnails from
 * separately reading the massive 12MP camera image at the exact same time.
 */
const loadSkiaImage = async (uri: string) => {
    if (skiaImagePromises.has(uri)) {
        return skiaImagePromises.get(uri);
    }

    // Keep cache size small (last 5 images max)
    if (skiaImagePromises.size > 5) {
        const firstKey = skiaImagePromises.keys().next().value;
        if (firstKey) skiaImagePromises.delete(firstKey);
    }

    const loadPromise = internalLoadSkiaImage(uri).catch(err => {
        skiaImagePromises.delete(uri); // Clear failed loads
        throw err;
    });

    skiaImagePromises.set(uri, loadPromise);
    return loadPromise;
};

/**
 * Renders the image with the selected filter applied using an off-screen
 * Skia surface at the specified resolution, then returns it as a
 * base64 data URI.
 *
 * @param uri         - file:// or data:image/... URI of the source image
 * @param filterName  - one of the filter names from FILTERS (e.g. 'grayscale')
 * @param maxSize     - optional max width/height for the output (used for thumbnails)
 * @param overlayUri  - optional overlay URI to composite on top of the image
 * @returns           - data:image/png;base64,... URI with the filter baked in,
 *                      or the original URI if filterName is 'none' / on error
 */
export const applyFilterToImage = async (
    uri: string,
    filterName: string,
    maxSize?: number,
    overlayUri?: string | null
): Promise<string> => {
    // Nothing to do for the original filter if no overlay or resize
    if (!uri || (filterName === 'none' && !overlayUri && !maxSize)) return uri;

    try {
        // 1. Load the image into Skia
        const skiaImage = await loadSkiaImage(uri);

        if (!skiaImage) {
            console.warn('applyFilterToImage: could not decode image');
            return uri;
        }

        let imgW = skiaImage.width();
        let imgH = skiaImage.height();

        // Scale down for thumbnails
        if (maxSize && (imgW > maxSize || imgH > maxSize)) {
            const scale = maxSize / Math.max(imgW, imgH);
            imgW = Math.round(imgW * scale);
            imgH = Math.round(imgH * scale);
        }

        // 2. Create an off-screen surface
        const surface = Skia.Surface.Make(imgW, imgH);
        if (!surface) {
            console.warn('applyFilterToImage: could not create Skia surface');
            return uri;
        }

        const canvas = surface.getCanvas();
        const paint = Skia.Paint();

        let colorFilter = null;
        let imageFilter = null;

        // 3. Apply the correct filter type
        if (filterName === 'blur') {
            // Blur is a spatial filter — use ImageFilter
            imageFilter = Skia.ImageFilter.MakeBlur(6, 6, TileMode.Clamp, null);
            paint.setImageFilter(imageFilter);
        } else if (filterName !== 'none') {
            // All other filters are color matrix transforms
            const matrix = getFilterMatrix(filterName);
            colorFilter = Skia.ColorFilter.MakeMatrix(matrix);
            paint.setColorFilter(colorFilter);
        }

        // 4. Draw the image with the filter paint
        const srcRect = Skia.XYWHRect(0, 0, skiaImage.width(), skiaImage.height());
        const dstRect = Skia.XYWHRect(0, 0, imgW, imgH);
        canvas.drawImageRect(skiaImage, srcRect, dstRect, paint);

        // 4.5. Draw overlay optionally (with the same filter applied to it!)
        if (overlayUri) {
            const overlayImage = await loadSkiaImage(overlayUri);
            if (overlayImage) {
                const overlayPaint = Skia.Paint();
                overlayPaint.setAlphaf(0.98);
                if (imageFilter) overlayPaint.setImageFilter(imageFilter);
                if (colorFilter) overlayPaint.setColorFilter(colorFilter);

                // Draw overlay stretching to fill the destination rect
                canvas.drawImageRect(
                    overlayImage,
                    Skia.XYWHRect(0, 0, overlayImage.width(), overlayImage.height()),
                    dstRect,
                    overlayPaint
                );
            }
        }

        // 5. Export as PNG base64
        const snapshot = surface.makeImageSnapshot();
        const base64 = snapshot.encodeToBase64();
        return `data:image/png;base64,${base64}`;

    } catch (err) {
        console.error('applyFilterToImage error:', err);
        return uri; // Fallback: upload without filter rather than crashing
    }
};

/**
 * Optimised save path — renders the filtered + overlay image and writes it
 * to a temporary JPEG file instead of returning a massive base64 data URI.
 *
 * Key differences from `applyFilterToImage`:
 * - Caps the output resolution to `maxSide` (default 2048) — still high
 *   quality but 6× fewer pixels than a raw 12MP camera shot.
 * - Encodes as JPEG (quality 85) instead of PNG — 10-20× smaller file.
 * - Writes directly to a temp file via RNFS — zero base64-string overhead.
 * - Returns a file:// URI ready for FormData upload.
 *
 * @returns file:// URI of the temp JPEG, or the original URI on error.
 */
export const applyFilterToFile = async (
    uri: string,
    filterName: string,
    overlayUri?: string | null,
    maxSide: number = 2048,
    jpegQuality: number = 85,
): Promise<string> => {
    // Fast path: no processing needed
    if (!uri || (filterName === 'none' && !overlayUri)) return uri;

    try {
        // 1. Load the source image
        const skiaImage = await loadSkiaImage(uri);
        if (!skiaImage) {
            console.warn('applyFilterToFile: could not decode image');
            return uri;
        }

        let imgW = skiaImage.width();
        let imgH = skiaImage.height();

        // 2. Cap to maxSide while preserving aspect ratio
        if (imgW > maxSide || imgH > maxSide) {
            const scale = maxSide / Math.max(imgW, imgH);
            imgW = Math.round(imgW * scale);
            imgH = Math.round(imgH * scale);
        }

        // 3. Off-screen render with filter
        const surface = Skia.Surface.Make(imgW, imgH);
        if (!surface) {
            console.warn('applyFilterToFile: could not create Skia surface');
            return uri;
        }

        const canvas = surface.getCanvas();
        const paint = Skia.Paint();

        let colorFilter = null;
        let imageFilter = null;

        if (filterName === 'blur') {
            imageFilter = Skia.ImageFilter.MakeBlur(6, 6, TileMode.Clamp, null);
            paint.setImageFilter(imageFilter);
        } else if (filterName !== 'none') {
            const matrix = getFilterMatrix(filterName);
            colorFilter = Skia.ColorFilter.MakeMatrix(matrix);
            paint.setColorFilter(colorFilter);
        }

        const srcRect = Skia.XYWHRect(0, 0, skiaImage.width(), skiaImage.height());
        const dstRect = Skia.XYWHRect(0, 0, imgW, imgH);
        canvas.drawImageRect(skiaImage, srcRect, dstRect, paint);

        // 4. Draw overlay (composited with same filter)
        if (overlayUri) {
            const overlayImage = await loadSkiaImage(overlayUri);
            if (overlayImage) {
                const overlayPaint = Skia.Paint();
                overlayPaint.setAlphaf(0.98);
                if (imageFilter) overlayPaint.setImageFilter(imageFilter);
                if (colorFilter) overlayPaint.setColorFilter(colorFilter);

                canvas.drawImageRect(
                    overlayImage,
                    Skia.XYWHRect(0, 0, overlayImage.width(), overlayImage.height()),
                    dstRect,
                    overlayPaint,
                );
            }
        }

        // 5. Encode as JPEG and write to temp file
        const snapshot = surface.makeImageSnapshot();
        const jpegBase64 = snapshot.encodeToBase64(ImageFormat.JPEG, jpegQuality);

        const tempPath = `${RNFS.CachesDirectoryPath}/filtered_${Date.now()}.jpg`;
        await RNFS.writeFile(tempPath, jpegBase64, 'base64');

        return `file://${tempPath}`;
    } catch (err) {
        console.error('applyFilterToFile error:', err);
        return uri; // Fallback: upload the original rather than crashing
    }
};
