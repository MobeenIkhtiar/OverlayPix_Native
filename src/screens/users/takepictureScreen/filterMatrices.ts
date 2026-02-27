/**
 * filterMatrices.ts
 *
 * CSS filter spec color-matrix implementations for Skia's ColorMatrix.
 * Each matrix is a 20-value array (4×5, row-major).
 * Transformation: R' = m[0]*R + m[1]*G + m[2]*B + m[3]*A + m[4]
 * All values (including bias) are in the 0-1 range.
 */

export const FILTERS = [
    { name: 'none', label: 'Original' },
    { name: 'grayscale', label: 'B&W' },
    { name: 'sepia', label: 'Vintage' },
    { name: 'invert', label: 'Invert' },
    { name: 'contrast', label: 'Contrast' },
    { name: 'brightness', label: 'Bright' },
    { name: 'blur', label: 'Soft' },
    { name: 'hue-rotate', label: 'Color' },
    { name: 'saturate', label: 'Vivid' },
    { name: 'warm', label: 'Warm' },
    { name: 'cool', label: 'Cool' },
] as const;

export type FilterName = typeof FILTERS[number]['name'];

// ─── Identity ────────────────────────────────────────────────────────────────

export const identity20 = (): number[] => [
    1, 0, 0, 0, 0,
    0, 1, 0, 0, 0,
    0, 0, 1, 0, 0,
    0, 0, 0, 1, 0,
];

// ─── Matrix composition ───────────────────────────────────────────────────────

/**
 * Compose two 4×5 color matrices: apply A first, then B.
 * Equivalent to CSS chaining: brightness(B) after sepia(A) etc.
 */
export const composeMatrix = (a: number[], b: number[]): number[] => {
    const out = new Array(20).fill(0);
    for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 5; c++) {
            if (c < 4) {
                for (let k = 0; k < 4; k++) out[r * 5 + c] += a[r * 5 + k] * b[k * 5 + c];
            } else {
                // Translation column
                for (let k = 0; k < 4; k++) out[r * 5 + 4] += a[r * 5 + k] * b[k * 5 + 4];
                out[r * 5 + 4] += a[r * 5 + 4];
            }
        }
    }
    return out;
};

// ─── Individual filter matrices ───────────────────────────────────────────────

/** grayscale(1) — CSS spec ITU-R BT.709 luminance weights */
export const grayscaleMatrix = (): number[] => [
    0.2126, 0.7152, 0.0722, 0, 0,
    0.2126, 0.7152, 0.0722, 0, 0,
    0.2126, 0.7152, 0.0722, 0, 0,
    0, 0, 0, 1, 0,
];

/** sepia(amount) — CSS spec, amount 0-1 */
export const sepiaMatrix = (amount: number): number[] => [
    1 - 0.607 * amount, 0.769 * amount, 0.189 * amount, 0, 0,
    0.349 * amount, 1 - 0.314 * amount, 0.168 * amount, 0, 0,
    0.272 * amount, 0.534 * amount, 1 - 0.869 * amount, 0, 0,
    0, 0, 0, 1, 0,
];

/** invert(1) */
export const invertMatrix = (): number[] => [
    -1, 0, 0, 0, 1,
    0, -1, 0, 0, 1,
    0, 0, -1, 0, 1,
    0, 0, 0, 1, 0,
];

/** contrast(amount) — CSS spec: out = amount*(in-0.5)+0.5 */
export const contrastMatrix = (amount: number): number[] => {
    const b = 0.5 * (1 - amount);
    return [
        amount, 0, 0, 0, b,
        0, amount, 0, 0, b,
        0, 0, amount, 0, b,
        0, 0, 0, 1, 0,
    ];
};

/** brightness(amount) — CSS spec: simple scale */
export const brightnessMatrix = (amount: number): number[] => [
    amount, 0, 0, 0, 0,
    0, amount, 0, 0, 0,
    0, 0, amount, 0, 0,
    0, 0, 0, 1, 0,
];

/** saturate(s) — CSS spec */
export const saturateMatrix = (s: number): number[] => [
    0.213 + 0.787 * s, 0.715 - 0.715 * s, 0.072 - 0.072 * s, 0, 0,
    0.213 - 0.213 * s, 0.715 + 0.285 * s, 0.072 - 0.072 * s, 0, 0,
    0.213 - 0.213 * s, 0.715 - 0.715 * s, 0.072 + 0.928 * s, 0, 0,
    0, 0, 0, 1, 0,
];

/** hue-rotate(deg) — CSS spec */
export const hueRotateMatrix = (deg: number): number[] => {
    const a = (deg * Math.PI) / 180;
    const c = Math.cos(a), s = Math.sin(a);
    return [
        0.213 + c * 0.787 - s * 0.213, 0.715 - c * 0.715 - s * 0.715, 0.072 - c * 0.072 + s * 0.928, 0, 0,
        0.213 - c * 0.213 + s * 0.143, 0.715 + c * 0.285 + s * 0.140, 0.072 - c * 0.072 - s * 0.283, 0, 0,
        0.213 - c * 0.213 - s * 0.787, 0.715 - c * 0.715 + s * 0.715, 0.072 + c * 0.928 + s * 0.072, 0, 0,
        0, 0, 0, 1, 0,
    ];
};

// ─── Main resolver ────────────────────────────────────────────────────────────

/**
 * Returns the 20-value Skia color matrix for a given filter name.
 * Returns identity matrix for 'none' and 'blur' (blur is handled separately).
 */
export const getFilterMatrix = (filterName: string): number[] => {
    switch (filterName) {
        case 'grayscale': return grayscaleMatrix();
        case 'sepia': return sepiaMatrix(0.8);
        case 'invert': return invertMatrix();
        case 'contrast': return contrastMatrix(1.5);
        case 'brightness': return brightnessMatrix(1.3);
        case 'saturate': return saturateMatrix(1.8);
        case 'hue-rotate': return hueRotateMatrix(90);
        // Composite filters — matrices multiplied in order
        case 'warm': return composeMatrix(
            composeMatrix(sepiaMatrix(0.3), brightnessMatrix(1.1)),
            saturateMatrix(1.2),
        );
        case 'cool': return composeMatrix(hueRotateMatrix(180), brightnessMatrix(0.9));
        default: return identity20();
    }
};
