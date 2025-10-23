import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, TouchableWithoutFeedback } from 'react-native';
import { AlertCircle } from 'lucide-react-native';
import { wp, hp } from '../contants/StyleGuide';

interface PhotoLimitModalProps {
    open: boolean;
    onClose: () => void;
}

const PhotoLimitModal: React.FC<PhotoLimitModalProps> = ({ open, onClose }) => {
    if (!open) return null;

    return (
        <Modal
            visible={open}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.backdrop} />
            </TouchableWithoutFeedback>
            <View style={styles.centeredView}>
                <View style={styles.modalView}>
                    {/* Info Icon */}
                    <View style={styles.iconContainer}>
                        <AlertCircle size={wp(6)} color="#FA9A54" />
                    </View>
                    
                    {/* Title */}
                    <Text style={styles.title}>Photo Limit Reached</Text>
                    
                    {/* Description */}
                    <Text style={styles.description}>
                        You've used all your photo slots for this event.
                    </Text>
                    
                    {/* Button */}
                    <TouchableOpacity
                        style={styles.button}
                        onPress={onClose}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.buttonText}>Got It!</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    backdrop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
    },
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: wp(6),
    },
    modalView: {
        backgroundColor: '#fff',
        borderRadius: wp(5),
        width: '100%',
        maxWidth: wp(85),
        paddingHorizontal: wp(8),
        paddingVertical: hp(3),
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 8,
    },
    iconContainer: {
        width: wp(16),
        height: wp(16),
        borderRadius: wp(8),
        backgroundColor: '#FEEBDD',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: hp(1.5),
    },
    title: {
        fontSize: wp(5),
        fontWeight: 'bold',
        color: '#1A2B49',
        textAlign: 'center',
        marginBottom: hp(1),
    },
    description: {
        fontSize: wp(3.5),
        color: '#666666',
        textAlign: 'center',
        marginBottom: hp(2.5),
        lineHeight: wp(5),
    },
    button: {
        backgroundColor: '#fff',
        borderWidth: 1.5,
        borderColor: '#FA9A54',
        paddingHorizontal: wp(8),
        paddingVertical: hp(1.5),
        borderRadius: wp(2.5),
        shadowColor: '#FA9A54',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    buttonText: {
        fontSize: wp(3.8),
        fontWeight: '600',
        color: '#FA9A54',
        textAlign: 'center',
    },
});

export default PhotoLimitModal; 