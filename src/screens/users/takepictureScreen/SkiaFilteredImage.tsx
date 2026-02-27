/**
 * SkiaFilteredImage.tsx
 *
 * A drop-in replacement for <Image> that applies CSS-equivalent filters
 * using Skia's ColorMatrix — giving pixel-perfect results identical to
 * the PWA on both iOS and Android.
 *
 * Supported filterName values (matching FILTERS array):
 *   'none' | 'grayscale' | 'sepia' | 'invert' | 'contrast' |
 *   'brightness' | 'blur' | 'hue-rotate' | 'saturate' | 'warm' | 'cool'
 */
import React, { useMemo, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import {
    BlurMask,
    Canvas,
    ColorMatrix,
    Group,
    Image as SkiaImage,
    useImage,
} from '@shopify/react-native-skia';
import { getFilterMatrix } from './filterMatrices';

interface SkiaFilteredImageProps {
    /** URI of the image to display */
    uri: string | null;
    /** Style applied to the outer container (must resolve to numeric width/height) */
    style: object;
    /** Filter name from FILTERS array, e.g. 'grayscale', 'warm', 'none' */
    filterName: string;
    /** Resize mode — same semantics as RN Image (default: 'cover') */
    fit?: 'cover' | 'contain' | 'fill';
}

const SkiaFilteredImage: React.FC<SkiaFilteredImageProps> = ({
    uri,
    style,
    filterName,
    fit = 'cover',
}) => {
    const image = useImage(uri || '');
    const matrix = useMemo(() => getFilterMatrix(filterName), [filterName]);

    const isNone = filterName === 'none';
    const isBlur = filterName === 'blur';

    // Skia Canvas requires numeric width/height — measure the container first
    const [dims, setDims] = useState<{ w: number; h: number }>({ w: 0, h: 0 });

    if (!uri) return <View style={style as any} />;

    // Phase 1: measure the container with a regular Image placeholder
    if (dims.w === 0 || dims.h === 0) {
        return (
            <View
                style={style as any}
                onLayout={e =>
                    setDims({
                        w: e.nativeEvent.layout.width,
                        h: e.nativeEvent.layout.height,
                    })
                }
            >
                <Image
                    source={{ uri }}
                    style={StyleSheet.absoluteFill}
                    resizeMode={fit as any}
                />
            </View>
        );
    }

    // Phase 2: render with Skia once dimensions are known
    return (
        <Canvas style={[style as any, { overflow: 'hidden' }]}>
            <Group>
                {/* Color matrix filters (all except blur) */}
                {!isNone && !isBlur && <ColorMatrix matrix={matrix} />}

                {/* Blur is a spatial filter — handled via BlurMask */}
                {isBlur && <BlurMask blur={3} style="normal" respectCTM />}

                <SkiaImage
                    image={image}
                    x={0}
                    y={0}
                    width={dims.w}
                    height={dims.h}
                    fit={fit}
                />
            </Group>
        </Canvas>
    );
};

export default SkiaFilteredImage;
