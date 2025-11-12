import { Image, StyleSheet, Text, TouchableOpacity, View, TextInput } from 'react-native'
import React, { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { hp, wp } from '../../../contants/StyleGuide'
import { icons } from '../../../contants/Icons'
import { useNavigation } from '@react-navigation/native'
import { ArrowRight } from 'lucide-react-native'
import { images } from '../../../contants/Images'

const OnBoarding = () => {
    const navigation: any = useNavigation();
    const [showJoinInput, setShowJoinInput] = useState(false);
    const [eventCode, setEventCode] = useState('');

    const handleJoinEventPress = () => {
        setShowJoinInput(true);
    };

    const handleJoinButton = () => {
        navigation.navigate('termsAndPolicy', { shareId: eventCode });
        setShowJoinInput(false);
        setEventCode('');
    };

    const handleCancel = () => {
        setShowJoinInput(false);
        setEventCode('');
    };

    return (
        <SafeAreaView style={styles.Container}>
            {/* Header */}
            <View style={styles.Header}>
                <View style={styles.headerTitleContainer}>
                    <Image source={icons.logo} style={{ width: wp(8), height: wp(8) }} />
                    <Text style={styles.headerTitle}>OverlayPix</Text>
                </View>
                <Text onPress={() => navigation.navigate('login')} style={[styles.headerTitle, { color: '#3DA9B7' }]}>Log In</Text>
            </View>
            <Text style={styles.onBoardText}>
                Capture <Text style={{ color: '#000' }}>&</Text> Share
            </Text>

            <Text style={styles.onBoardSubText}>Moment with style</Text>

            <Text style={styles.onBoardDescText}>Create unforgettable photo experiences. Guests snap photos with fun, custom overlays, and share instantly.</Text>
            <View style={styles.joinEventContainer}>
                {!showJoinInput ? (
                    <TouchableOpacity style={styles.joinEventButton} onPress={handleJoinEventPress}>
                        <Text style={styles.joinEventButtonText}>Join An Event</Text>
                        <ArrowRight size={wp(6)} color="#3DA9B7" />
                    </TouchableOpacity>
                    
                ) : (
                    <View>
                        <TextInput
                            style={styles.joinEventTextInput}
                            placeholder="Enter event code"
                            value={eventCode}
                            onChangeText={setEventCode}
                            placeholderTextColor="#8e9aaf"
                            autoCapitalize="none"
                        />
                        <View style={styles.joinEventInputContainer}>
                        <TouchableOpacity
                            style={[
                                styles.joinEventSubmitButton,
                                { backgroundColor: eventCode.trim() !== '' ? '#3DA9B7' : '#B5E0E6' }
                            ]}
                            onPress={handleJoinButton}
                            disabled={eventCode.trim() === ''}
                        >
                            <Text style={styles.joinEventSubmitButtonText}>
                                Join
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={handleCancel}
                        >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                        </View>
                    </View>
                )}
            </View>
            
           <Image source={images.onBoardImage} style={{ width: wp(80), height: wp(80), alignSelf: 'center', marginTop: hp(4) }} resizeMode='contain' />

        </SafeAreaView>
    )
}

export default OnBoarding

const styles = StyleSheet.create({
    Container: {
        flex: 1,
        backgroundColor: '#F8FFFF',
        padding: wp(4)
    },
    Header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: wp(4),
        fontWeight: '600',
        color: '#000',
        marginLeft: wp(2)
    },
    headerTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    onBoardText: {
        fontSize: wp(6),
        fontWeight: '600',
        color: '#3DA9B7',
        marginTop: hp(4),
        textAlign: 'center'
    },
    onBoardSubText: {
        fontSize: wp(7),
        fontWeight: '600',
        color: '#000',
        marginTop: wp(2),
        textAlign: 'center'
    },
    onBoardDescText: {
        fontSize: wp(4),
        fontWeight: '400',
        color: '#59606C',
        marginTop: wp(3),
        textAlign: 'center',
        paddingHorizontal: wp(6)
    },
    joinEventContainer: {
        marginTop: hp(4)
    },
    joinEventButton: {
        backgroundColor: '#DDF2F5',
        paddingHorizontal: wp(10),
        paddingVertical: wp(4),
        borderRadius: wp(2),
        marginTop: wp(2),
        alignItems: 'center',
        alignSelf: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        gap: wp(2)
    },
    joinEventButtonText: {
        fontSize: wp(4.5),
        fontWeight: '600',
        color: '#3DA9B7'
    },
    joinEventInputContainer: {
        marginTop: wp(4),
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'center',
        gap: wp(6)
    },
    joinEventTextInput: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#DDF2F5',
        borderRadius: wp(1),
        paddingVertical: wp(3),
        paddingHorizontal: wp(4),
        fontSize: wp(4),
        minWidth: wp(32),
        color: '#000'
    },
    joinEventSubmitButton: {
        backgroundColor: '#3DA9B7',
        borderRadius: wp(2),
        paddingVertical: wp(2.5),
        paddingHorizontal: wp(5),
        justifyContent: 'center',
        alignItems: 'center'
    },
    joinEventSubmitButtonText: {
        fontSize: wp(4.5),
        fontWeight: '500',
        color: '#fff'
    },
    cancelButton: {
        backgroundColor: '#fff',
        borderColor: '#d9534f',
        borderWidth: 1,
        borderRadius: wp(2),
        paddingVertical: wp(2.5),
        paddingHorizontal: wp(5),
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: wp(1)
    },
    cancelButtonText: {
        color: '#d9534f',
        fontSize: wp(4),
        fontWeight: '600'
    }
})