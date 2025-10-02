import React, { useState, useEffect, useMemo } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View, ScrollView } from 'react-native';
import Header from '../../components/Header';
import { useNavigation } from '@react-navigation/native';
import { endPoints } from '../../services/Endpoints';
import { dashboardService } from '../../services/dashboardService';
import { wp, hp } from '../../contants/StyleGuide';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus } from 'lucide-react-native';
import StatsCard from '../../components/StatsCard';
import EventCard from '../../components/EventCard';
import JoinedEventCard from '../../components/JoinedEventCard';
import { useCreateEvent } from '../../hooks/useCreateEvent';

// Type guard to check if an object is a Firestore Timestamp
const isFirestoreTimestamp = (obj: unknown): obj is { _seconds: number; _nanoseconds: number } => {
    return Boolean(obj && typeof obj === 'object' && '_seconds' in obj && '_nanoseconds' in obj);
};

type EventType = {
    eventId: string;
    name: string;
    type: string;
    status: string;
    date: any;
    photosCount: number;
    guestsCount: number;
    storageExpired: boolean;
    // Add other fields as needed
};

type DashboardDataType = {
    totalEvents: number;
    activeEvents: number;
    totalPhotos: number;
    totalGuests: number;
    events: EventType[];
    joinedEvents?: EventType[];
};

const DashboardScreen: React.FC = () => {
    const [yourdashboardData, setYourDashboardData] = useState<DashboardDataType | null>(null);
    const [joinedDashboardData, setJoinedDashboardData] = useState<DashboardDataType | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [activeTab, setActiveTab] = useState<'your' | 'joined'>('your');

    const navigation: any = useNavigation();

    const { loadEventForEdit, resetEventData } = useCreateEvent();

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                const endPoint = activeTab === 'your' ? endPoints.dashboard : 'guests/events';
                const data: any = await dashboardService.getDashboardData(endPoint);

                if (activeTab === 'your') {
                    setYourDashboardData(data);
                } else {
                    setJoinedDashboardData(data);
                }
            } catch (error) {
                console.error('Failed to fetch dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [activeTab]);

    const handleCreateEvent = () => {
        // Reset the context to ensure clean form data
        resetEventData();
        navigation.navigate('createEvent');
    };

    // const handleEditEvent = async (eventId: string) => {
    //     try {
    //         await loadEventForEdit(eventId);
    //         navigation.navigate(`createEvent?edit=${eventId}`);
    //     } catch (error) {
    //         console.error('Failed to load event for editing:', error);
    //     }
    // };

    // Memoized filtered events for live search
    const filteredYourEvents = useMemo(() => {
        if (!yourdashboardData?.events) return [];
        if (!searchTerm.trim()) return yourdashboardData.events;
        return yourdashboardData.events.filter(event =>
            event.name?.toLowerCase().includes(searchTerm.trim().toLowerCase())
        );
    }, [yourdashboardData, searchTerm]);

    const filteredJoinedEvents = useMemo(() => {
        if (!joinedDashboardData?.events) return [];
        if (!searchTerm.trim()) return joinedDashboardData.events;
        return joinedDashboardData.events.filter(event =>
            event.name?.toLowerCase().includes(searchTerm.trim().toLowerCase())
        );
    }, [joinedDashboardData, searchTerm]);

    return (
        <SafeAreaView style={styles.container}>
            <Header
                title="Event Dashboard"
                subtitle="Manage and track all your events"
            />

            {/* Search and Create Event Row */}
            <View style={styles.searchCreateRow}>
                {/* Search Box */}
                <View style={styles.searchBox}>
                    {/* Search Icon */}
                    <TextInput
                        style={styles.searchInput}
                        placeholder={`Search ${activeTab === 'your' ? 'your events' : 'joined events'} ...`}
                        placeholderTextColor="#9CA3AF"
                        value={searchTerm}
                        onChangeText={setSearchTerm}
                        autoCorrect={false}
                        autoCapitalize="none"
                        accessibilityLabel={`Search ${activeTab === 'your' ? 'your events' : 'joined events'} by name`}
                    />
                </View>
                {/* Create Event Button (only for "Your Events" tab) */}
                <TouchableOpacity
                    onPress={handleCreateEvent}
                    style={styles.createEventButton}
                    activeOpacity={0.7}
                >
                    <Plus size={wp(5)} color="#fff" />
                    <Text style={styles.createEventButtonText}>
                        Create Event
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Loading indicator */}
            {loading && (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#3DA9B7" />
                </View>
            )}

            {activeTab === 'your' && (
                <View style={styles.statsContainer}>
                    <StatsCard
                        value={yourdashboardData?.totalEvents || 0}
                        label="Total Events"
                    />
                    <StatsCard
                        value={yourdashboardData?.activeEvents || 0}
                        label="Active Events"
                    />
                    <StatsCard
                        value={yourdashboardData?.totalPhotos || 0}
                        label="Total Photos"
                    />
                    <StatsCard
                        value={yourdashboardData?.totalGuests || 0}
                        label="Total Guests"
                    />
                </View>
            )}

            {/* Tabs */}
            <View style={styles.tabsRow}>
                <TouchableOpacity
                    style={[
                        styles.tabButton,
                        activeTab === 'your'
                            ? styles.tabButtonActive
                            : styles.tabButtonInactive
                    ]}
                    onPress={() => setActiveTab('your')}
                    activeOpacity={0.8}
                >
                    <Text
                        style={[
                            styles.tabButtonText,
                            activeTab === 'your'
                                ? styles.tabButtonTextActive
                                : styles.tabButtonTextInactive
                        ]}
                    >
                        Your Events
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        styles.tabButton,
                        activeTab === 'joined'
                            ? styles.tabButtonActive
                            : styles.tabButtonInactive
                    ]}
                    onPress={() => setActiveTab('joined')}
                    activeOpacity={0.8}
                >
                    <Text
                        style={[
                            styles.tabButtonText,
                            activeTab === 'joined'
                                ? styles.tabButtonTextActive
                                : styles.tabButtonTextInactive
                        ]}
                    >
                        Joined Events
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Event Cards */}
            <ScrollView
                contentContainerStyle={{ flexGrow: 1, paddingHorizontal: wp(4), paddingTop: hp(2), paddingBottom: hp(4) }}
                showsVerticalScrollIndicator={false}
            >
                {activeTab === 'your' ? (
                    filteredYourEvents && filteredYourEvents.length > 0 ? (
                        <View style={{ flex: 1 }}>
                            {filteredYourEvents.map((event: EventType, index: number) => (
                                <View key={event?.eventId || index} style={{ marginBottom: hp(2) }}>
                                    <EventCard
                                        title={event?.name || ''}
                                        type={event?.type}
                                        status={event?.status}
                                        storageExpired={event?.storageExpired}
                                        date={
                                            isFirestoreTimestamp(event.date)
                                                ? new Date(event.date._seconds * 1000).toLocaleDateString('en-US')
                                                : (typeof event.date === 'string'
                                                    ? (() => {
                                                        const d = new Date(event.date);
                                                        return isNaN(d.getTime())
                                                            ? event.date.split(' ')[0]
                                                            : d.toLocaleDateString('en-US');
                                                    })()
                                                    : event.date)
                                        }
                                        photos={event.photosCount}
                                        guests={event.guestsCount}
                                        onViewImages={() => { navigation.navigate(`eventGallery`, { eventId: event.eventId }) }}
                                        onEdit={() => { }
                                            //  handleEditEvent(event.eventId)
                                        }
                                        onUpgrade={() => { navigation.navigate(`upgradeEvent`, { eventId: event.eventId }) }}
                                        onQRCode={() => { navigation.navigate(`inviteGuestEasily`, { eventId: event.eventId }) }}
                                    />
                                </View>
                            ))}
                        </View>
                    ) : (
                        !loading && (
                            <View style={{ width: '100%', justifyContent: 'center', alignItems: 'center', marginTop: hp(10) }}>
                                <View style={{ alignItems: 'center' }}>
                                    <Text style={{ color: '#6B7280', fontSize: wp(4.2), textAlign: 'center' }}>No events found</Text>
                                    <Text style={{ color: '#6B7280', fontSize: wp(3.2), textAlign: 'center', marginTop: 4 }}>Create your first event to get started</Text>
                                </View>
                            </View>
                        )
                    )
                ) : (
                    filteredJoinedEvents && filteredJoinedEvents.length > 0 ? (
                        <View style={{ flex: 1 }}>
                            {filteredJoinedEvents.map((event: any, index: number) => (
                                <View key={event.eventId || index} style={{ marginBottom: hp(2) }}>
                                    <JoinedEventCard
                                        title={event?.eventName || ''}
                                        type={event.eventCategory}
                                        status={event.eventStatus}
                                        storageExpired={event?.storageExpired}
                                        date={
                                            isFirestoreTimestamp(event.eventDate)
                                                ? new Date(event.eventDate._seconds * 1000).toLocaleDateString('en-US')
                                                : (typeof event.eventDate === 'string'
                                                    ? (() => {
                                                        const d = new Date(event.eventDate);
                                                        return isNaN(d.getTime())
                                                            ? event.eventDate.split(' ')[0]
                                                            : d.toLocaleDateString('en-US');
                                                    })()
                                                    : event.eventDate)
                                        }
                                        photos={event.photosUploaded}
                                        guests={event.guestName}
                                        // Only allow view images for joined events
                                        onViewImages={() => { navigation.navigate(`userGallery`, { eventId: event?.eventId, fromDashboard: true }) }}
                                    // // Hide edit/upgrade/qr for joined events
                                    // onEdit={undefined}
                                    // onUpgrade={undefined}
                                    // onQRCode={undefined}
                                    />
                                </View>
                            ))}
                        </View>
                    ) : (
                        !loading && (
                            <View style={{ width: '100%', justifyContent: 'center', alignItems: 'center', marginTop: hp(10) }}>
                                <View style={{ alignItems: 'center' }}>
                                    <Text style={{ color: '#6B7280', fontSize: wp(4.2), textAlign: 'center' }}>No joined events found</Text>
                                    <Text style={{ color: '#6B7280', fontSize: wp(3.2), textAlign: 'center', marginTop: 4 }}>Ask your friends to invite you to their events!</Text>
                                </View>
                            </View>
                        )
                    )
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

export default DashboardScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F6FEFF',
    },
    text: {
        color: '#000',
        fontSize: wp(8),
    },
    searchCreateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: hp(1),
        paddingHorizontal: wp(4),
    },
    searchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: wp(2),
        flex: 1,
        borderColor: '#E5E7EB',
        borderWidth: 1,
        marginRight: wp(2),
    },
    searchIconContainer: {
        marginRight: wp(2),
        justifyContent: 'center',
        alignItems: 'center',
    },
    svgIconWrapper: {
        width: wp(5),
        height: wp(5),
        backgroundColor: 'transparent',
        // You can use a react-native-svg icon here if needed
    },
    searchInput: {
        flex: 1,
        fontWeight: '500',
        fontSize: wp(3.2),
        paddingLeft: wp(4)
    },
    createEventButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: wp(3),
        paddingVertical: hp(1.2),
        backgroundColor: '#3DA9B7',
        borderRadius: wp(1.5),
    },
    createEventButtonText: {
        marginLeft: wp(2),
        fontSize: wp(3.5),
        color: '#fff',
        fontWeight: '600',
    },
    loadingContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: hp(2),
    },
    statsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: wp(2),
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: wp(4),
        marginTop: hp(2),
    },
    tabsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: wp(2),
        marginTop: hp(3),
        paddingHorizontal: wp(4),
    },
    tabButton: {
        paddingHorizontal: wp(4),
        paddingVertical: hp(1.2),
        borderTopLeftRadius: wp(2),
        borderTopRightRadius: wp(2),
        borderWidth: 1,
        borderColor: '#3DA9B7',
        marginHorizontal: wp(1),
        backgroundColor: '#fff',
    },
    tabButtonActive: {
        backgroundColor: '#3DA9B7',
        borderColor: '#3DA9B7',
    },
    tabButtonInactive: {
        backgroundColor: '#fff',
        borderColor: '#3DA9B7',
    },
    tabButtonText: {
        fontWeight: '600',
        fontSize: wp(3.5),
    },
    tabButtonTextActive: {
        color: '#fff',
    },
    tabButtonTextInactive: {
        color: '#3DA9B7',
    },
});