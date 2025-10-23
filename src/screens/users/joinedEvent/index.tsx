import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    TextInput,
    ScrollView,
    ActivityIndicator,
    StyleSheet,
    FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { dashboardService } from '../../../services/dashboardService';
import JoinedEventCard from '../../../components/JoinedEventCard';
import Header from '../../../components/Header';
import { wp, hp } from '../../../contants/StyleGuide';

// Minimal type for joined event, adjust as needed
interface JoinedEvent {
    eventId: string;
    eventName?: string;
    eventCategory?: string;
    eventStatus?: string;
    eventDate?: { _seconds: number; _nanoseconds: number } | string;
    photosUploaded?: number;
    guestName?: number;
    storageExpired?: boolean;
    [key: string]: unknown;
}

const isFirestoreTimestamp = (date: unknown): date is { _seconds: number; _nanoseconds: number } =>
    !!date && typeof date === 'object' && '_seconds' in date && '_nanoseconds' in date;

const JoinedEvents: React.FC = () => {
    const [loading, setLoading] = useState<boolean>(false);
    const [events, setEvents] = useState<JoinedEvent[]>([]);
    const [showJoinInput, setShowJoinInput] = useState<boolean>(false);
    const [joinShareCode, setJoinShareCode] = useState<string>('');
    const [joinLoading, setJoinLoading] = useState<boolean>(false);
    const [joinError, setJoinError] = useState<string | null>(null);
    const navigation = useNavigation<any>();

    // Fetch live joined events data on component mount
    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                const endPoint = 'guests/events';
                const data: any = await dashboardService.getDashboardData(endPoint);

                console.log('joined events data=>>>>>>>>', data);

                if (data && Array.isArray(data.events)) {
                    setEvents(data.events as JoinedEvent[]);
                } else {
                    setEvents([]);
                }
            } catch (error) {
                console.error('Failed to fetch dashboard data:', error);
                setEvents([]);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    // Handler for joining event by share code
    const handleJoinEvent = async () => {
        setJoinError(null);

        if (!joinShareCode.trim()) {
            setJoinError('Please enter a valid event share code.');
            return;
        }

        setJoinLoading(true);

        try {
            // Navigate to the terms&policy page for the share code
            navigation.navigate('termsAndPolicy', {
                shareId: joinShareCode.trim(),
                fromDashboard: true,
            });
            await AsyncStorage.setItem('guest_login', 'true');
        } catch {
            setJoinError('Failed to join event. Please check the code and try again.');
        } finally {
            setJoinLoading(false);
        }
    };

    const renderEventItem = ({ item, index }: { item: JoinedEvent; index: number }) => (
        <JoinedEventCard
            key={item.eventId || index}
            title={item?.eventName || ''}
            type={item.eventCategory}
            status={item.eventStatus}
            storageExpired={item?.storageExpired}
            date={
                isFirestoreTimestamp(item.eventDate)
                    ? new Date(item.eventDate._seconds * 1000).toLocaleDateString('en-US')
                    : typeof item.eventDate === 'string'
                        ? (() => {
                            const d = new Date(item.eventDate as string);
                            return isNaN(d.getTime())
                                ? (typeof (item as { date?: string }).date === 'string'
                                    ? (item as { date?: string }).date!.split(' ')[0]
                                    : '')
                                : d.toLocaleDateString('en-US');
                        })()
                        : (item.eventDate as any)
            }
            photos={typeof item.photosUploaded === 'number' ? item.photosUploaded : undefined}
            guests={typeof item.guestName === 'number' ? item.guestName : undefined}
            onViewImages={() => {
                navigation.navigate('userGallery', {
                    eventId: item?.eventId,
                    fromDashboard: true,
                });
            }}
        />
    );

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Header row with Join Event button */}
                <View style={styles.headerRow}>
                    <View style={styles.headerLeft}>
                        <Header
                            title="Joined Event Dashboard"
                            subtitle="Track all your events"
                            isDashboard={true}
                        />
                    </View>
                </View>

                <View style={styles.headerRight}>
                    <Text style={styles.pageTitle}>My Joined Events</Text>
                    {!showJoinInput && (
                        <TouchableOpacity
                            style={styles.joinButton}
                            onPress={() => setShowJoinInput(true)}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.joinButtonText}>Join Event</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Join Event by Share Code Input */}
                {showJoinInput && (
                    <View style={styles.joinInputContainer}>
                        <TextInput
                            style={styles.shareCodeInput}
                            placeholder="Enter event share code"
                            placeholderTextColor="#9CA3AF"
                            value={joinShareCode}
                            autoCapitalize="none"
                            onChangeText={(text) => setJoinShareCode(text.toLowerCase())}
                            editable={!joinLoading}
                            autoFocus
                        />
                        <View style={styles.joinButtonRow}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={() => {
                                    setShowJoinInput(false);
                                    setJoinShareCode('');
                                    setJoinError(null);
                                }}
                                disabled={joinLoading}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.submitButton, joinLoading && styles.submitButtonDisabled]}
                                onPress={handleJoinEvent}
                                disabled={joinLoading}
                                activeOpacity={0.8}
                            >
                                {joinLoading ? (
                                    <View style={styles.loadingRow}>
                                        <ActivityIndicator size="small" color="#fff" />
                                        <Text style={styles.submitButtonText}>Joining...</Text>
                                    </View>
                                ) : (
                                    <Text style={styles.submitButtonText}>Join</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {joinError && (
                    <Text style={styles.errorText}>{joinError}</Text>
                )}

                {/* Loader */}
                {loading && (
                    <View style={styles.loaderContainer}>
                        <ActivityIndicator size="large" color="#3DA9B7" />
                    </View>
                )}

                {!loading && (
                    <>
                        {events && events.length > 0 ? (
                            <FlatList
                                data={events}
                                renderItem={renderEventItem}
                                keyExtractor={(item, index) => item.eventId || String(index)}
                                contentContainerStyle={styles.eventsList}
                                scrollEnabled={false}
                            />
                        ) : (
                            <View style={styles.emptyStateContainer}>
                                <View style={styles.emptyStateTextContainer}>
                                    <Text style={styles.emptyStateText}>
                                        You haven't joined any events yet. Go join some fun!
                                    </Text>
                                    <Text style={styles.emptyStateSubtext}>
                                        Ask your friends to invite you to their events!
                                    </Text>
                                </View>
                            </View>
                        )}
                    </>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

export default JoinedEvents;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F6FEFF',
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: wp(3),
        paddingTop: hp(2),
        paddingBottom: hp(4),
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: hp(2),
    },
    headerLeft: {
        flex: 1,
    },
    headerRight: {
        justifyContent: 'space-between',
        marginTop: hp(1),
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: hp(2),
    },
    joinButton: {
        backgroundColor: '#3DA9B7',
        paddingHorizontal: wp(4),
        paddingVertical: hp(1.5),
        borderRadius: wp(2),
        justifyContent: 'center',
        alignContent: 'center'
    },
    joinButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: wp(3.5),
    },
    pageTitle: {
        fontWeight: 'bold',
        fontSize: wp(6),
        color: '#3DA9B7',
    },
    joinInputContainer: {
        backgroundColor: '#fff',
        borderRadius: wp(4),
        padding: wp(4),
        marginBottom: hp(3),
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: wp(2),
        shadowOffset: { width: 0, height: 2 },
        elevation: 3,
        borderWidth: 1,
        borderColor: '#C6F1F6',
        marginTop: hp(1),
    },
    shareCodeInput: {
        borderWidth: 1,
        borderColor: '#3DA9B7',
        borderRadius: wp(2),
        paddingHorizontal: wp(3),
        paddingVertical: hp(1.5),
        fontSize: wp(3.5),
        color: '#333',
        marginBottom: hp(2),
    },
    joinButtonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: wp(4),
    },
    cancelButton: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#3DA9B7',
        borderRadius: wp(2),
        paddingVertical: hp(1.5),
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
    },
    cancelButtonText: {
        color: '#3DA9B7',
        fontWeight: '600',
        fontSize: wp(3.5),
    },
    submitButton: {
        flex: 1,
        backgroundColor: '#3DA9B7',
        borderRadius: wp(2),
        paddingVertical: hp(1.5),
        alignItems: 'center',
        justifyContent: 'center',
    },
    submitButtonDisabled: {
        opacity: 0.6,
    },
    submitButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: wp(3.5),
    },
    loadingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: wp(2),
    },
    errorText: {
        color: '#EF4444',
        fontSize: wp(3.5),
        textAlign: 'center',
        marginBottom: hp(2),
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: hp(4),
    },
    eventsList: {
        marginTop: hp(2),
        paddingBottom: hp(2),
    },
    emptyStateContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: hp(10),
    },
    emptyStateTextContainer: {
        alignItems: 'center',
    },
    emptyStateText: {
        color: '#7B8A9D',
        fontSize: wp(3.5),
        textAlign: 'center',
        marginBottom: hp(1),
    },
    emptyStateSubtext: {
        color: '#7B8A9D',
        fontSize: wp(3.5),
        textAlign: 'center',
    },
});
