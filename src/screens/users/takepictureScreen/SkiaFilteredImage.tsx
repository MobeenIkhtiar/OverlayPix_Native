/**
 * SkiaFilteredImage.tsx
 *
 * A drop-in replacement for <Image> that applies CSS-equivalent filters
 * using Skia's imperative API — giving pixel-perfect results identical
 * on both iOS and Android.
 *
 * Instead of relying on the declarative <Canvas>/<ColorMatrix> tree
 * (which can render differently on Android vs iOS due to GPU compositing
 * differences), we use Skia's offscreen surface to bake the filter into
 * a base64 image and display it with a plain RN <Image>.
 *
 * Supported filterName values (matching FILTERS array):
 *   'none' | 'grayscale' | 'sepia' | 'invert' | 'contrast' |
 *   'brightness' | 'blur' | 'hue-rotate' | 'saturate' | 'warm' | 'cool'
 */
import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { applyFilterToImage } from './applySkiaFilter';

interface SkiaFilteredImageProps {
    /** URI of the image to display */
    uri: string | null;
    /** Style applied to the outer container (must resolve to numeric width/height) */
    style: object;
    /** Filter name from FILTERS array, e.g. 'grayscale', 'warm', 'none' */
    filterName: string;
    /** Resize mode — same semantics as RN Image (default: 'cover') */
    fit?: 'cover' | 'contain' | 'fill' | 'stretch';
    /** Optional overlay to draw over the image Native-side */
    overlayUri?: string | null;
    /** Optional maximum dimension (width or height) to scale down to */
    maxSize?: number;
}

const SkiaFilteredImage: React.FC<SkiaFilteredImageProps> = ({
    uri,
    style,
    filterName,
    fit = 'cover',
    overlayUri,
    maxSize,
}) => {
    const [filteredUri, setFilteredUri] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        if (!uri) {
            setFilteredUri(null);
            return;
        }

        // For 'none' without a resize, just use the original
        if (filterName === 'none' && !maxSize) {
            setFilteredUri(uri);
            return;
        }

        // Apply the filter using the same imperative Skia path
        // that is used by applySkiaFilter.ts for saving — guaranteed
        // to be identical on Android and iOS.
        applyFilterToImage(uri, filterName, maxSize, overlayUri).then(result => {
            if (!cancelled) {
                setFilteredUri(result);
            }
        });

        return () => {
            cancelled = true;
        };
    }, [uri, filterName, overlayUri, maxSize]);

    if (!uri) return <View style={style as any} />;

    return (
        <View style={style as any}>
            <Image
                source={{ uri: filteredUri || uri }}
                style={StyleSheet.absoluteFill}
                resizeMode={fit as any}
            />
        </View>
    );
};

export default SkiaFilteredImage;
