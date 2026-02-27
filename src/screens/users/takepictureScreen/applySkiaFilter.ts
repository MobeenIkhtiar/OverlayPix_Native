/**
 * applySkiaFilter.ts
 *
 * Off-screen Skia rendering utility that bakes a filter into image pixel data.
 * Call this before uploading so the saved image matches what the user sees.
 */
import { Skia, TileMode } from '@shopify/react-native-skia';
import { getFilterMatrix } from './filterMatrices';

/**
 * Renders the image with the selected filter applied using an off-screen
 * Skia surface at the image's native resolution, then returns it as a
 * base64 data URI.
 *
 * @param uri         - file:// or data:image/... URI of the source image
 * @param filterName  - one of the filter names from FILTERS (e.g. 'grayscale')
 * @returns           - data:image/png;base64,... URI with the filter baked in,
 *                      or the original URI if filterName is 'none' / on error
 */
export const applyFilterToImage = async (
    uri: string,
    filterName: string,
): Promise<string> => {
    // Nothing to do for the original filter
    if (!uri || filterName === 'none') return uri;

    try {
        // 1. Load the image bytes into Skia
        const response = await fetch(uri);
        const buffer = await response.arrayBuffer();
        const data = Skia.Data.fromBytes(new Uint8Array(buffer));
        const skiaImage = Skia.Image.MakeImageFromEncoded(data);

        if (!skiaImage) {
            console.warn('applyFilterToImage: could not decode image');
            return uri;
        }

        const imgW = skiaImage.width();
        const imgH = skiaImage.height();

        // 2. Create an off-screen surface at native resolution (preserves quality)
        const surface = Skia.Surface.Make(imgW, imgH);
        if (!surface) {
            console.warn('applyFilterToImage: could not create Skia surface');
            return uri;
        }

        const canvas = surface.getCanvas();
        const paint = Skia.Paint();

        // 3. Apply the correct filter type
        if (filterName === 'blur') {
            // Blur is a spatial filter — use ImageFilter
            const blurFilter = Skia.ImageFilter.MakeBlur(6, 6, TileMode.Clamp, null);
            paint.setImageFilter(blurFilter);
        } else {
            // All other filters are color matrix transforms
            const matrix = getFilterMatrix(filterName);
            const colorFilter = Skia.ColorFilter.MakeMatrix(matrix);
            paint.setColorFilter(colorFilter);
        }

        // 4. Draw the image with the filter paint
        const srcRect = Skia.XYWHRect(0, 0, imgW, imgH);
        canvas.drawImageRect(skiaImage, srcRect, srcRect, paint);

        // 5. Export as PNG base64
        const snapshot = surface.makeImageSnapshot();
        const base64 = snapshot.encodeToBase64();
        return `data:image/png;base64,${base64}`;

    } catch (err) {
        console.error('applyFilterToImage error:', err);
        return uri; // Fallback: upload without filter rather than crashing
    }
};
