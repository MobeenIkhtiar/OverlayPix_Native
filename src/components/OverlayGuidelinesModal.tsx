import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, TouchableWithoutFeedback, Platform } from 'react-native';
import { wp, hp } from '../contants/StyleGuide';

interface OverlayGuidelinesModalProps {
    open: boolean;
    onClose: () => void;
}

const OverlayGuidelinesModal: React.FC<OverlayGuidelinesModalProps> = ({ open, onClose }) => {
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
                    {/* Close Button */}
                    <TouchableOpacity
                        style={styles.closeButton}
                        onPress={onClose}
                        activeOpacity={0.7}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Text style={styles.closeButtonText}>&times;</Text>
                    </TouchableOpacity>
                    <View style={styles.contentContainer}>
                        <Text style={styles.headerText}>
                            Want your overlay to look great?{'\n'}Follow these quick tips:
                        </Text>
                        {/* PNG tip */}
                        <View style={styles.tipBox}>
                            <Text style={styles.tipText}>
                                Use a transparent <Text style={styles.linkText}>PNG</Text>
                            </Text>
                        </View>
                        {/* Best sizes */}
                        <View style={[styles.tipBox, { paddingVertical: hp(1.5) }]}>
                            <Text style={styles.tipLabel}>Best sizes:</Text>
                            <View style={{ marginTop: hp(0.5) }}>
                                <View style={styles.sizeRow}>
                                    <Text style={styles.bullet}>•</Text>
                                    <Text style={styles.sizeLabel}>Portrait:</Text>
                                    <Text style={styles.sizeValue}>1080 × 1920</Text>
                                    <Text style={styles.sizeUnit}>px</Text>
                                </View>
                                <View style={styles.sizeRow}>
                                    <Text style={styles.bullet}>•</Text>
                                    <Text style={styles.sizeLabel}>Landscape:</Text>
                                    <Text style={styles.sizeValue}>1920 × 1080</Text>
                                    <Text style={styles.sizeUnit}>px</Text>
                                </View>
                            </View>
                        </View>
                        {/* Tools */}
                        <View style={styles.tipBox}>
                            <Text style={styles.toolText}>
                                Use tools like <Text style={styles.linkText}>Canva</Text>, <Text style={[styles.linkText, styles.underline]}>Photoshop</Text>, or <Text style={[styles.linkText, styles.underline]}>Pixlr</Text>
                            </Text>
                        </View>
                        {/* Stock preview photos */}
                        <View style={styles.tipBox}>
                            <Text style={styles.toolText}>
                                Try it with our <Text style={styles.linkText}>stock preview photos</Text>
                            </Text>
                        </View>
                        {/* Faces & edges */}
                        <View style={styles.tipBox}>
                            <Text style={styles.toolText}>
                                Leave space around <Text style={styles.linkText}>faces & edges</Text> (avoid covering the center)
                            </Text>
                        </View>
                        {/* File size & format */}
                        <View style={styles.tipBox}>
                            <Text style={styles.toolText}>
                                Files must be under <Text style={styles.linkText}>3 MB</Text> and in .png format
                            </Text>
                        </View>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    backdrop: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.10)',
        // No blur on Android, iOS can use blurView if needed
    },
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: wp(6),
    },
    modalView: {
        backgroundColor: '#fff',
        borderRadius: wp(3),
        width: '100%',
        maxWidth: wp(90),
        padding: wp(4),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.18,
        shadowRadius: 8,
        elevation: 8,
        zIndex: 10,
    },
    closeButton: {
        position: 'absolute',
        top: wp(3),
        right: wp(3),
        zIndex: 20,
    },
    closeButtonText: {
        color: '#808080',
        fontSize: wp(7),
        fontWeight: 'bold',
    },
    contentContainer: {
        flexDirection: 'column',
        gap: hp(1.2),
        marginTop: wp(2),
    },
    headerText: {
        fontWeight: '500',
        fontSize: wp(3.2),
        color: '#000',
        opacity: 0.6,
        textAlign: 'left',
        marginBottom: hp(1),
    },
    tipBox: {
        backgroundColor: '#FAFAFA',
        borderRadius: wp(1),
        paddingHorizontal: wp(4),
        paddingVertical: hp(1),
        marginBottom: hp(0.7),
    },
    tipText: {
        fontSize: wp(3.2),
        color: '#646464',
        flexDirection: 'row',
        alignItems: 'center',
    },
    linkText: {
        color: '#3DA9B7',
    },
    underline: {
        textDecorationLine: 'underline',
    },
    tipLabel: {
        fontWeight: '500',
        fontSize: wp(3.2),
        color: '#646464',
        textAlign: 'left',
    },
    sizeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: hp(0.2),
    },
    bullet: {
        color: '#3DA9B7',
        fontSize: wp(4.5),
        marginRight: wp(1),
        marginTop: Platform.OS === 'ios' ? 0 : -2,
    },
    sizeLabel: {
        color: '#646464',
        fontSize: wp(2.7),
        marginRight: wp(1),
    },
    sizeValue: {
        color: '#3DA9B7',
        fontSize: wp(2.7),
        marginRight: wp(1),
    },
    sizeUnit: {
        color: '#646464',
        fontSize: wp(2.7),
    },
    toolText: {
        fontSize: wp(2.5),
        color: '#646464',
        textAlign: 'left',
    },
});

export default OverlayGuidelinesModal;