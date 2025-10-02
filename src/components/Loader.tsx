import React from 'react';
import { View, ActivityIndicator, StyleSheet, ViewStyle } from 'react-native';
import { wp } from '../contants/StyleGuide';
interface LoaderProps {
    size?: 'small' | 'medium' | 'large';
    color?: string;
    style?: ViewStyle;
}

const sizeMap = {
    small: { wpValue: 6, hp: 3 },
    medium: { wpValue: 9, hp: 4.5 },
    large: { wpValue: 12, hp: 6 },
};

const Loader: React.FC<LoaderProps> = ({
    size = "medium",
    color = '#3DA9B7',
    style = {},
}) => {
    const { wpValue } = sizeMap[size] || sizeMap["medium"];
    const indicatorSize = wp(wpValue);

    return (
        <View style={[styles.container, { width: indicatorSize, height: indicatorSize }, style]}>
            <ActivityIndicator size={indicatorSize} color={color} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default Loader;