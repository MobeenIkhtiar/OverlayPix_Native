import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View, GestureResponderEvent, ViewStyle, TextStyle } from 'react-native';

interface CustomButtonProps {
    title: string;
    onPress?: (event: GestureResponderEvent) => void;
    disabled?: boolean;
    loading?: boolean;
    testID?: string;
}

const CustomButton: React.FC<CustomButtonProps> = ({
    title,
    onPress,
    disabled = false,
    loading = false,
    testID,
}) => {
    return (
        <TouchableOpacity
            style={[
                styles.button,
                disabled ? styles.disabled : {},
            ]}
            onPress={onPress}
            activeOpacity={0.8}
            disabled={disabled || loading}
            testID={testID}
        >
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator color="#fff" size="small" />
                    <Text style={[styles.text, { marginLeft: 8 }]}>
                        {typeof title === 'string' ? title : 'Loading...'}
                    </Text>
                </View>
            ) : (
                <Text style={[styles.text]}>
                    {title}
                </Text>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        backgroundColor: '#3DA9B7',
        borderRadius: 8,
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 12,
        shadowColor: '#3DA9B7',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 2,
    },
    disabled: {
        backgroundColor: '#B0BEC5',
    },
    text: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 16,
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default CustomButton;