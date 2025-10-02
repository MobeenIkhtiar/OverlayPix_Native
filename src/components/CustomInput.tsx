import React, { useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, TextInputProps, KeyboardTypeOptions } from 'react-native';
import { hp, wp } from '../contants/StyleGuide';
import { Eye, EyeOff } from 'lucide-react-native';

interface InputProps {
    label?: string;
    icon?: React.ReactNode;
    error?: string;
    onChange?: (val: string) => void;
    secureTextEntry?: boolean;
    value?: string;
    placeholder?: string;
    keyboardType?: KeyboardTypeOptions;
    readOnly?: boolean;
    disabled?: boolean;
}

const CustomInput: React.FC<InputProps> = ({ label, icon, error, secureTextEntry, onChange, value, placeholder, readOnly, disabled, keyboardType, ...rest }) => {
    const inputRef = useRef<TextInput>(null);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    const isPasswordField = !!secureTextEntry;
    const resolvedSecure = isPasswordField ? !isPasswordVisible : false;

    // Focus input when the box is clicked
    const handleBoxPress = () => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    };

    return (
        <View style={styles.container}>
            {label && (
                <Text style={styles.label}>{label}</Text>
            )}
            <TouchableOpacity
                activeOpacity={1}
                style={[
                    styles.inputBox,
                    error ? styles.inputBoxError : {},
                ]}
                onPress={handleBoxPress}
            >
                {icon && (
                    <View style={styles.iconContainer}>
                        {icon}
                    </View>
                )}
                <TextInput
                    ref={inputRef}
                    style={styles.input}
                    placeholder={placeholder}
                    placeholderTextColor="#7B8A9D"
                    secureTextEntry={resolvedSecure}
                    onChangeText={onChange}
                    value={value}
                    keyboardType={keyboardType}
                    readOnly={readOnly}
                    disabled={disabled}
                    {...rest}
                />
                {isPasswordField && (
                    <TouchableOpacity
                        onPress={() => setIsPasswordVisible((prev) => !prev)}
                        style={styles.eyeButton}
                        activeOpacity={0.7}
                        accessibilityLabel={isPasswordVisible ? 'Hide password' : 'Show password'}
                    >
                        {isPasswordVisible ? (
                            <EyeOff size={wp(5)} color="#7B8A9D" />
                        ) : (
                            <Eye size={wp(5)} color="#7B8A9D" />
                        )}
                    </TouchableOpacity>
                )}
            </TouchableOpacity>

            {error && (
                <Text style={styles.errorText}>{error}</Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: hp(2),
        width: '100%',
    },
    label: {
        marginBottom: hp(0.7),
        fontWeight: '500',
        fontSize: wp(3.7),
        color: '#000',
        opacity: 0.5,
        textAlign: 'left',
    },
    inputBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: wp(2),
        paddingHorizontal: wp(3.5),
        height: hp(6),
        width: '100%',
    },
    inputBoxError: {
        borderColor: '#EF4444',
    },
    iconContainer: {
        marginRight: wp(2),
        justifyContent: 'center',
        alignItems: 'center',
    },
    input: {
        flex: 1,
        height: '100%',
        color: '#1E293B',
        fontSize: wp(3),
        paddingVertical: 0,
    },
    eyeButton: {
        marginLeft: wp(2),
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%',
    },
    errorText: {
        color: '#EF4444',
        fontSize: wp(3.2),
        marginTop: hp(0.5),
        textAlign: 'left',
    },
});

export default CustomInput;