import React, { useState, useEffect } from 'react';
import { Calendar, ChevronDown, ChevronUp, Clock, X } from 'lucide-react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useCreateEvent } from '../../hooks/useCreateEvent';
import CalendarPicker from 'react-native-calendar-picker';
import {
    Platform,
    TouchableOpacity,
    Text,
    View,
    Alert,
    StyleSheet,
    ScrollView,
    TextInput,
    KeyboardAvoidingView,
    Modal,
    Image,
    Pressable,
    FlatList,
    Switch
} from 'react-native';
import Header from '../../components/Header';
import Stepper from '../../components/Stepper';
import OverlaySelector from '../../components/OverlaySelector';
import OverlayGuidelinesModal from '../../components/OverlayGuidelinesModal';
import { hp, wp } from '../../contants/StyleGuide';
import { SafeAreaView } from 'react-native-safe-area-context';

// Updated event type list with "other" option
const EVENT_TYPES = [
    { value: "anniversary", label: "Anniversary" },
    { value: "baby_shower", label: "Baby Shower" },
    { value: "birthday_party", label: "Birthday Party" },
    { value: "charity_fundraiser", label: "Charity / Fundraiser" },
    { value: "church_event", label: "Church Event" },
    { value: "community_event", label: "Community Event" },
    { value: "concert_live_show", label: "Concert / Live Show" },
    { value: "conference_expo", label: "Conference or Expo" },
    { value: "corporate_event", label: "Corporate Event" },
    { value: "engagement_party", label: "Engagement Party" },
    { value: "family_reunion", label: "Family Reunion" },
    { value: "festival_fair", label: "Festival / Fair" },
    { value: "funeral_memorial", label: "Funeral / Memorial" },
    { value: "gender_reveal", label: "Gender Reveal" },
    { value: "grand_opening", label: "Grand Opening" },
    { value: "graduation", label: "Graduation" },
    { value: "holiday_celebration", label: "Holiday Celebration" },
    { value: "marketing_campaign", label: "Marketing Campaign" },
    { value: "private_party", label: "Private Party" },
    { value: "product_launch", label: "Product Launch" },
    { value: "prom_school_dance", label: "Prom / School Dance" },
    { value: "religious_ceremony", label: "Religious Ceremony" },
    { value: "school_event", label: "School Event" },
    { value: "sports_game_tournament", label: "Sports Game / Tournament" },
    { value: "trade_show", label: "Trade Show" },
    { value: "wedding", label: "Wedding" },
    { value: "other", label: "Other (please specify)" },
];

// Helper to generate time options in 15-minute increments
const generateTimeOptions = () => {
    const options = [];
    for (let hour = 0; hour < 24; hour++) {
        for (let min = 0; min < 60; min += 15) {
            const h = hour.toString().padStart(2, '0');
            const m = min.toString().padStart(2, '0');
            options.push(`${h}:${m}`);
        }
    }
    return options;
};

const TIME_OPTIONS = generateTimeOptions();

const CreateEventScreen: React.FC = () => {
    const [eventDetailsOpen, setEventDetailsOpen] = useState<boolean>(true);
    const [photoOverlayOpen, setPhotoOverlayOpen] = useState<boolean>(false);
    const [showOverlayGuidelines, setShowOverlayGuidelines] = useState(false);
    const [isEditMode, setIsEditMode] = useState<boolean>(false);
    const [startTime, setStartTime] = useState<string>("");
    const [endTime, setEndTime] = useState<string>("");
    const [endTimeError, setEndTimeError] = useState<string>("");
    const [customEventType, setCustomEventType] = useState<string>("");

    const [showOverlayNameInput, setShowOverlayNameInput] = useState(false);
    const [overlayNameValue, setOverlayNameValue] = useState<string>("");

    // OverlaySelector modal state
    const [overlaySelectorOpen, setOverlaySelectorOpen] = useState(false);

    // 24 hours checkbox state
    const [is24Hours, setIs24Hours] = useState<boolean>(false);

    // Track if user has manually selected end time
    const [endTimeManuallySelected, setEndTimeManuallySelected] = useState<boolean>(false);

    // For 24 hour mode, store the calculated end date (next day)
    const [twentyFourHourEndDate, setTwentyFourHourEndDate] = useState<Date | null>(null);

    const navigation = useNavigation<any>();

    const route = useRoute<any>();

    const eventId = route?.params?.eventId;

    const { step1Data, updateStep1Data, isStep1Valid, resetEventData } = useCreateEvent();

    const [eventDate, setEventDate] = useState<Date | null>(
        step1Data.date ? new Date(step1Data.date) : null
    );

    // State for showing/hiding the date picker modal
    const [showDatePicker, setShowDatePicker] = useState<boolean>(false);

    // For previewing the uploaded overlay image
    const [overlayPreviewUrl, setOverlayPreviewUrl] = useState<string | null>(null);

    // Error state for event name length
    const [nameError, setNameError] = useState<string>("");

    // Check if we're in edit mode by checking route params and step1Data
    useEffect(() => {
        console.log('editParam', eventId);
        if (eventId) {
            setIsEditMode(true);
        } else {
            setIsEditMode(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [eventId, step1Data.name]);

    useEffect(() => {
        if (
            step1Data.type &&
            !EVENT_TYPES.some((type) => type.value === step1Data.type)
        ) {
            updateStep1Data({ type: "other" });
            setCustomEventType(step1Data.type);
        }
    }, [step1Data.type, updateStep1Data]);

    // Keep overlayNameValue in sync with step1Data.overlayName
    useEffect(() => {
        setOverlayNameValue(step1Data.overlayName || "");
    }, [step1Data.overlayName]);

    // Validate event name length
    useEffect(() => {
        if (step1Data.name && step1Data.name.trim().length > 0 && step1Data.name.trim().length < 3) {
            setNameError("Event name must be at least 3 characters.");
        } else {
            setNameError("");
        }
    }, [step1Data.name]);

    // Helper to format time as HH:MM AM/PM
    const formatTime = (time: string) => {
        if (!time) return "";
        const [hourStr, minute] = time.split(":");
        let hour = parseInt(hourStr, 10);
        const ampm = hour >= 12 ? "PM" : "AM";
        hour = hour % 12 || 12;
        return `${hour}:${minute} ${ampm}`;
    };

    // Helper to add minutes to a time string "HH:MM"
    const addMinutes = (time: string, minutesToAdd: number) => {
        const [hour, min] = time.split(":").map(Number);
        let total = hour * 60 + min + minutesToAdd;
        total = ((total % (24 * 60)) + (24 * 60)) % (24 * 60); // wrap around 24h
        const newHour = Math.floor(total / 60).toString().padStart(2, '0');
        const newMin = (total % 60).toString().padStart(2, '0');
        return `${newHour}:${newMin}`;
    };

    // Helper to get next day date from a Date object
    const getNextDay = (date: Date) => {
        const next = new Date(date);
        next.setDate(next.getDate() + 1);
        return next;
    };

    // Helper to check if selected date is today
    const isSelectedDateToday = () => {
        if (!eventDate) return false;
        const today = new Date();
        const selected = new Date(eventDate);
        return (
            today.getFullYear() === selected.getFullYear() &&
            today.getMonth() === selected.getMonth() &&
            today.getDate() === selected.getDate()
        );
    };

    // Helper to filter out past time slots for today
    const filterPastTimesForToday = (timeOptions: string[]) => {
        if (!isSelectedDateToday()) return timeOptions;

        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();

        return timeOptions.filter(timeOption => {
            const [hour, minute] = timeOption.split(':').map(Number);
            // Only show times that are at least 15 minutes from now
            const timeInMinutes = hour * 60 + minute;
            const currentTimeInMinutes = currentHour * 60 + currentMinute + 15; // Add 15 min buffer
            return timeInMinutes >= currentTimeInMinutes;
        });
    };

    // When user selects event type
    const handleEventTypeChange = (value: string) => {
        if (value === "other") {
            updateStep1Data({ type: "other" });
            setCustomEventType("");
        } else {
            updateStep1Data({ type: value });
            setCustomEventType("");
        }
    };

    // When user types custom event type
    const handleCustomEventTypeChange = (text: string) => {
        setCustomEventType(text);
        updateStep1Data({ type: text });
    };

    // Validate end time is not more than 24 hours after start time
    useEffect(() => {
        if (!startTime || !endTime) {
            setEndTimeError("");
            return;
        }
        // Both times are in "HH:MM" 24-hour format
        // If endTime >= startTime, difference is endTime - startTime
        // If endTime < startTime, it means endTime is on the next day
        const [startHour, startMin] = startTime.split(":").map(Number);
        const [endHour, endMin] = endTime.split(":").map(Number);

        const startTotal = startHour * 60 + startMin;
        const endTotal = endHour * 60 + endMin;

        let diff = endTotal - startTotal;
        if (diff < 0) {
            diff += 24 * 60;
        }

        if (diff > 24 * 60) {
            setEndTimeError("End time cannot be more than 24 hours after start time.");
        } else if (diff === 0) {
            setEndTimeError("End time must be after start time.");
        } else {
            setEndTimeError("");
        }
    }, [startTime, endTime]);

    // When 24 hours checkbox is checked, set end time to start time + 24h - 1min, and disable end time editing
    useEffect(() => {
        if (is24Hours && startTime) {
            // Set end time to start time + 24h - 1min
            const end = addMinutes(startTime, 24 * 60 - 1);
            setEndTime(end);
            updateStep1Data({ endTime: end });
            setEndTimeManuallySelected(false);

            // Set the next day for display
            if (eventDate) {
                setTwentyFourHourEndDate(getNextDay(eventDate));
            } else {
                setTwentyFourHourEndDate(null);
            }
        } else {
            setTwentyFourHourEndDate(null);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [is24Hours, startTime, eventDate]);

    // Keep startTime and endTime in sync with step1Data (for controlled select)
    useEffect(() => {
        if (step1Data.startTime !== startTime) {
            setStartTime(step1Data.startTime || "");
        }
        if (step1Data.endTime !== endTime) {
            setEndTime(step1Data.endTime || "");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [step1Data.startTime, step1Data.endTime]);

    // Handle overlay preview URL when overlay file changes or when overlay is selected
    useEffect(() => {
        // If overlay is an object with uri (from image picker), show its preview
        if (step1Data.overlay && typeof step1Data.overlay === 'object' && 'uri' in step1Data.overlay && typeof step1Data.overlay.uri === 'string') {
            setOverlayPreviewUrl(step1Data.overlay.uri);
        }
        // If overlay is a string (URL), show it
        else if (typeof step1Data.overlay === 'string' && step1Data.overlay) {
            setOverlayPreviewUrl(step1Data.overlay);
        }
        // If overlayId is set and overlay is not an object, use overlayId to get the src (from selected overlay)
        else if (step1Data.overlayId && step1Data.overlayId !== '') {
            setOverlayPreviewUrl(typeof step1Data.overlay === 'string' ? step1Data.overlay : '');
        }
        else {
            setOverlayPreviewUrl(null);
        }
    }, [step1Data.overlay, step1Data.overlayId]);

    // --- Custom logic for disabling start times after end time is manually selected ---
    // If user manually selects end time, restrict start time options to not be after end time (unless end time is before 12:00 PM)
    // Also filter out past times if today's date is selected
    const getFilteredStartTimeOptions = () => {
        let filteredOptions = TIME_OPTIONS;

        // First, filter out past times if today is selected
        filteredOptions = filterPastTimesForToday(filteredOptions);

        // Then apply existing end time filtering logic
        if (!endTimeManuallySelected || !endTime) return filteredOptions;
        const [endHour, endMin] = endTime.split(":").map(Number);
        if (endHour < 12) return filteredOptions;
        return filteredOptions.filter(option => {
            const [optHour, optMin] = option.split(":").map(Number);
            if (optHour < endHour) return true;
            if (optHour === endHour && optMin < endMin) return true;
            return false;
        });
    };

    // --- Custom logic for disabling end times before start time if end time is manually selected ---
    // If user manually selects end time, restrict end time options to only those after start time, unless end time is before 12:00 PM
    // Also filter out past times if today's date is selected
    const getFilteredEndTimeOptions = () => {
        let filteredOptions = TIME_OPTIONS;

        // First, filter out past times if today is selected
        filteredOptions = filterPastTimesForToday(filteredOptions);

        // Then apply existing start time filtering logic
        if (!startTime) return filteredOptions;
        if (endTimeManuallySelected) {
            const [endHour] = endTime.split(":").map(Number);
            if (endHour < 12) return filteredOptions;
        }
        const [startHour, startMin] = startTime.split(":").map(Number);
        return filteredOptions.filter(option => {
            const [optHour, optMin] = option.split(":").map(Number);
            if (optHour > startHour) return true;
            if (optHour === startHour && optMin > startMin) return true;
            return false;
        });
    };

    // Helper to format date as MM/DD/YYYY for display
    const formatDate = (date: Date | null) => {
        if (!date) return "";
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        const yyyy = date.getFullYear();
        return `${mm}/${dd}/${yyyy}`;
    };

    // Remove overlay handler
    const handleRemoveOverlay = () => {
        updateStep1Data({ overlay: '', overlayId: '', overlayName: '' });
        setOverlayNameValue('');
    };

    // File/image picker for overlay using react-native-image-picker
    const handleOverlayImagePick = async () => {
        try {
            const result = await launchImageLibrary({
                mediaType: 'photo',
                selectionLimit: 1,
                quality: 1,
                includeBase64: false,
                presentationStyle: 'fullScreen',
            });

            if (result.didCancel) {
                return;
            }

            if (result.errorCode) {
                Alert.alert('Error', result.errorMessage || 'Failed to pick image');
                return;
            }

            const selectedAsset = result.assets?.[0];
            if (!selectedAsset) {
                Alert.alert('Error', 'No image selected');
                return;
            }

            // Check if the selected file is a PNG
            const isPNG = selectedAsset.type === 'image/png';
            if (!isPNG) {
                Alert.alert('Invalid Format', 'Please select a PNG image with transparency');
                return;
            }

            // Update the overlay data
            if (selectedAsset.uri && selectedAsset.type) {
                // // Create a File object from the selected asset
                // const response = await fetch(selectedAsset.uri);
                // const blob = await response.blob();
                // const file = new File(
                //     [blob],
                //     selectedAsset.fileName ?? 'overlay.png',
                //     { type: selectedAsset.type }
                // );
                // // Store the file with uri property for preview
                // const fileWithUri = Object.assign(file, { uri: selectedAsset.uri });
                updateStep1Data({
                    overlay: {
                        uri: selectedAsset.uri,
                        type: selectedAsset.type,
                        name: selectedAsset.fileName,
                    }
                });
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to pick image');
            console.error('Image picker error:', error);
        }
    };

    // Custom Picker for Event Type
    const renderEventTypePicker = () => (
        <View style={styles.eventTypePickerContainer}>
            <Text style={[styles.label, styles.labelWithOpacity]}>
                Event Type <Text style={styles.required}>*</Text>
            </Text>
            <TouchableOpacity
                style={styles.select}
                onPress={() => setEventTypeModalVisible(true)}
            >
                <Text style={step1Data.type ? styles.eventTypeText : styles.eventTypeTextPlaceholder}>
                    {step1Data.type
                        ? (EVENT_TYPES.find(t => t.value === step1Data.type)?.label || customEventType)
                        : 'Select Event Type'}
                </Text>
            </TouchableOpacity>
            {/* Show custom input if "other" is selected */}
            {(
                (step1Data.type === "other") ||
                (
                    step1Data.type &&
                    !EVENT_TYPES.some((type) => type.value === step1Data.type)
                )
            ) && (
                    <TextInput
                        style={[styles.input, styles.eventTypeCustomInput]}
                        placeholder="Please specify event type"
                        placeholderTextColor={'#9e9e9e'}
                        value={customEventType}
                        onChangeText={handleCustomEventTypeChange}
                    />
                )}
        </View>
    );

    // Custom Picker for Time (Start/End)
    const renderTimePicker = ({
        label,
        value,
        onChange,
        options,
        icon,
        disabled = false,
        testID,
    }: {
        label: string,
        value: string,
        onChange: (val: string) => void,
        options: string[],
        icon?: React.ReactNode,
        disabled?: boolean,
        testID?: string,
    }) => (
        <View style={styles.timePickerContainer}>
            <Text style={[styles.label, styles.labelWithOpacity]}>
                {label} <Text style={styles.required}>*</Text>
            </Text>
            <TouchableOpacity
                style={[
                    styles.select,
                    styles.timePickerSelect,
                    disabled && styles.timePickerSelectDisabled
                ]}
                onPress={() => {
                    if (!disabled) setTimePickerModal({ open: true, label, value, onChange, options });
                }}
                disabled={disabled}
                testID={testID}
            >
                {icon}
                <Text style={[
                    value ? styles.timePickerText : styles.timePickerTextPlaceholder,
                    icon ? styles.timePickerTextWithIcon : null
                ]}>
                    {value ? formatTime(value) : `Select ${label}`}
                </Text>
            </TouchableOpacity>
        </View>
    );

    // Modal state for pickers
    const [eventTypeModalVisible, setEventTypeModalVisible] = useState(false);
    const [timePickerModal, setTimePickerModal] = useState<{
        open: boolean,
        label?: string,
        value?: string,
        onChange?: (val: string) => void,
        options?: string[]
    }>({ open: false });

    // For overlay image picker, use react-native-image-picker or similar
    // For now, just a placeholder

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView contentContainerStyle={styles.scrollContainer}>
                    <Header
                        title={isEditMode ? "Edit Event" : "Create Event"}
                        subtitle=""
                        logoHover={true}
                    />
                    {/* stepper */}
                    <Stepper steps={4} activeStep={1} />

                    {/* Event details */}
                    <View style={styles.card}>
                        {/* Collapsible: Event Details */}
                        <TouchableOpacity
                            style={[
                                styles.collapsibleHeader,
                                eventDetailsOpen ? styles.collapsibleHeaderOpen : styles.collapsibleHeaderClosed
                            ]}
                            onPress={() => setEventDetailsOpen((v) => !v)}>
                            <View style={styles.collapsibleContent}>
                                <View style={styles.collapsibleHeaderRow}>
                                    <View>
                                        <Text style={styles.eventDetailsTitle}>
                                            Event Details
                                        </Text>
                                        <Text style={styles.eventDetailsSubtitle}>
                                            Basic information about your event
                                        </Text>
                                    </View>
                                    <View>
                                        {eventDetailsOpen ? <ChevronUp size={wp(7)} color="#6B7280" /> : <ChevronDown size={wp(7)} color="#6B7280" />}
                                    </View>
                                </View>
                            </View>
                        </TouchableOpacity>
                        {eventDetailsOpen && (
                            <View style={styles.eventDetailsContent}>
                                {/* Event Name */}
                                <View>
                                    <Text style={[styles.label, styles.labelWithOpacity]}>Event Name <Text style={styles.required}>*</Text></Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Enter Event Name"
                                        placeholderTextColor={'#9e9e9e'}
                                        value={step1Data.name}
                                        onChangeText={(text) => updateStep1Data({ name: text })}
                                    />
                                    {nameError ? (
                                        <Text style={styles.errorText}>{nameError}</Text>
                                    ) : null}
                                </View>
                                {/* Event Type Picker */}
                                {renderEventTypePicker()}
                                {/* Event Type Modal */}
                                <Modal
                                    visible={eventTypeModalVisible}
                                    transparent
                                    animationType="fade"
                                    onRequestClose={() => setEventTypeModalVisible(false)}
                                >
                                    <Pressable style={styles.modalOverlay} onPress={() => setEventTypeModalVisible(false)}>
                                        <View style={styles.modalContent}>
                                            <FlatList
                                                data={EVENT_TYPES}
                                                keyExtractor={item => item.value}
                                                renderItem={({ item }) => (
                                                    <TouchableOpacity
                                                        style={styles.eventTypeModalItem}
                                                        onPress={() => {
                                                            handleEventTypeChange(item.value);
                                                            setEventTypeModalVisible(false);
                                                        }}
                                                    >
                                                        <Text style={styles.eventTypeModalItemText}>{item.label}</Text>
                                                    </TouchableOpacity>
                                                )}
                                            />
                                        </View>
                                    </Pressable>
                                </Modal>
                                {/* Event Date with react-native-calendar-picker */}
                                <View>
                                    <Text style={[styles.label, styles.labelWithOpacity]}>
                                        Event Date <Text style={styles.required}>*</Text>
                                    </Text>
                                    <TouchableOpacity
                                        style={styles.datePickerButton}
                                        onPress={() => setShowDatePicker(true)}
                                    >
                                        <Calendar size={wp(5)} color="#9CA3AF" />
                                        <Text style={eventDate ? styles.datePickerText : styles.datePickerTextPlaceholder}>
                                            {eventDate ? formatDate(eventDate) : "MM/DD/YYYY"}
                                        </Text>
                                    </TouchableOpacity>

                                    <Modal
                                        visible={showDatePicker}
                                        transparent
                                        animationType="fade"
                                        onRequestClose={() => setShowDatePicker(false)}
                                    >
                                        <Pressable style={styles.modalOverlay} onPress={() => setShowDatePicker(false)}>
                                            <View style={styles.calendarModalContent}>
                                                <CalendarPicker
                                                    selectedStartDate={eventDate || undefined}
                                                    minDate={new Date(new Date().setHours(0, 0, 0, 0))}
                                                    width={wp(90)}
                                                    onDateChange={(date: Date) => {
                                                        if (!date) return;

                                                        const now = new Date();
                                                        now.setHours(0, 0, 0, 0);

                                                        const picked = new Date(date as Date);
                                                        picked.setHours(0, 0, 0, 0);

                                                        if (picked.getTime() < now.getTime()) {
                                                            Alert.alert(
                                                                "Invalid Date",
                                                                "Please select today or a future date for your event.",
                                                                [{ text: "OK" }]
                                                            );
                                                            return;
                                                        }

                                                        setEventDate(picked);

                                                        const year = picked.getFullYear();
                                                        const month = String(picked.getMonth() + 1).padStart(2, '0');
                                                        const day = String(picked.getDate()).padStart(2, '0');
                                                        const formattedDate = `${year}-${month}-${day}`;

                                                        updateStep1Data({ date: formattedDate });
                                                        setShowDatePicker(false);
                                                    }}
                                                />
                                            </View>
                                        </Pressable>
                                    </Modal>
                                </View>
                                {/* Start Time Picker */}
                                {renderTimePicker({
                                    label: "Start Time",
                                    value: step1Data.startTime,
                                    onChange: (val) => {
                                        setStartTime(val);
                                        updateStep1Data({ startTime: val });
                                        if (is24Hours && val) {
                                            const end = addMinutes(val, 24 * 60 - 1);
                                            setEndTime(end);
                                            updateStep1Data({ endTime: end });
                                            setEndTimeManuallySelected(false);
                                            if (eventDate) {
                                                setTwentyFourHourEndDate(getNextDay(eventDate));
                                            } else {
                                                setTwentyFourHourEndDate(null);
                                            }
                                        }
                                        if (endTime && !is24Hours) {
                                            setEndTime(endTime);
                                        }
                                    },
                                    options: getFilteredStartTimeOptions(),
                                    icon: <Clock size={wp(5)} color="#9CA3AF" />,
                                    disabled: false,
                                    testID: "startTimePicker"
                                })}
                                {/* End Time Picker and 24h Switch */}
                                <View style={styles.endTimePickerRow}>
                                    <View style={styles.endTimePickerInnerRow}>
                                        {!is24Hours && renderTimePicker({
                                            label: "End Time",
                                            value: step1Data.endTime,
                                            onChange: (val) => {
                                                setEndTime(val);
                                                updateStep1Data({ endTime: val });
                                                setEndTimeManuallySelected(true);
                                            },
                                            options: getFilteredEndTimeOptions(),
                                            icon: <Clock size={wp(5)} color="#9CA3AF" />,
                                            disabled: is24Hours,
                                            testID: "endTimePicker"
                                        })}
                                        <View style={styles.endTimeSwitchRow}>
                                            <Switch
                                                value={is24Hours}
                                                onValueChange={checked => {
                                                    setIs24Hours(checked);
                                                    if (checked && startTime) {
                                                        const end = addMinutes(startTime, 24 * 60 - 1);
                                                        setEndTime(end);
                                                        updateStep1Data({ endTime: end });
                                                        setEndTimeManuallySelected(false);
                                                        if (eventDate) {
                                                            setTwentyFourHourEndDate(getNextDay(eventDate));
                                                        } else {
                                                            setTwentyFourHourEndDate(null);
                                                        }
                                                    } else {
                                                        setTwentyFourHourEndDate(null);
                                                    }
                                                }}
                                                thumbColor={is24Hours ? "#3DA9B7" : "#f4f3f4"}
                                                trackColor={{ false: "#D1D5DB", true: "#B6E6F2" }}
                                                style={styles.endTimeSwitch}
                                            />
                                            <Text style={styles.endTimeSwitchText}>
                                                Set for 24 hours
                                            </Text>
                                        </View>
                                    </View>
                                    {/* Show next day and end time if 24 hour mode is enabled and startTime is selected */}
                                    {is24Hours && startTime && eventDate && twentyFourHourEndDate && (
                                        <View style={styles.twentyFourHourInfoBox}>
                                            <Text style={styles.twentyFourHourInfoBoxTitle}>
                                                End Date: <Text style={styles.twentyFourHourInfoBoxValue}>{formatDate(twentyFourHourEndDate)}</Text>
                                            </Text>
                                            <Text style={styles.twentyFourHourInfoBoxTitle}>
                                                End Time: <Text style={styles.twentyFourHourInfoBoxValue}>{formatTime(addMinutes(startTime, 24 * 60 - 1))}</Text>
                                            </Text>
                                        </View>
                                    )}
                                    {!is24Hours && endTime && (
                                        <Text style={styles.endTimeSelectedText}>
                                            Selected: {formatTime(endTime)}
                                        </Text>
                                    )}
                                    {endTimeError && (
                                        <Text style={styles.endTimeErrorText}>
                                            {endTimeError}
                                        </Text>
                                    )}
                                </View>
                                {/* Time Picker Modal */}
                                <Modal
                                    visible={timePickerModal.open}
                                    transparent
                                    animationType="fade"
                                    onRequestClose={() => setTimePickerModal({ open: false })}
                                >
                                    <Pressable style={styles.modalOverlay} onPress={() => setTimePickerModal({ open: false })}>
                                        <View style={styles.modalContent}>
                                            <FlatList
                                                data={timePickerModal.options || []}
                                                keyExtractor={item => item}
                                                renderItem={({ item }) => (
                                                    <TouchableOpacity
                                                        style={styles.timePickerModalItem}
                                                        onPress={() => {
                                                            if (timePickerModal.onChange) timePickerModal.onChange(item);
                                                            setTimePickerModal({ open: false });
                                                        }}
                                                    >
                                                        <Text style={styles.timePickerModalItemText}>{formatTime(item)}</Text>
                                                    </TouchableOpacity>
                                                )}
                                            />
                                        </View>
                                    </Pressable>
                                </Modal>
                            </View>
                        )}
                        {/* Collapsible: Photo Overlay Preview */}
                        <TouchableOpacity
                            style={[
                                styles.photoOverlayHeader,
                                photoOverlayOpen ? styles.photoOverlayHeaderOpen : styles.photoOverlayHeaderClosed
                            ]}
                            onPress={() => setPhotoOverlayOpen((v) => !v)}
                            activeOpacity={0.8}
                        >
                            <View style={styles.photoOverlayHeaderRow}>
                                <View>
                                    <Text style={styles.photoOverlayHeaderTitle}>Photo Overlay</Text>
                                    <Text style={styles.photoOverlayHeaderSubtitle}>
                                        Customize how your event{'\n'}branding appears on photos
                                    </Text>
                                </View>
                                <View>
                                    {photoOverlayOpen ? <ChevronUp size={wp(7)} color="#636565" /> : <ChevronDown size={wp(7)} color="#636565" />}
                                </View>
                            </View>
                        </TouchableOpacity>
                        {photoOverlayOpen && (
                            <View style={styles.photoOverlayContent}>
                                {/* Title & Guidelines */}
                                <View style={styles.photoOverlayTitleBox}>
                                    <Text style={styles.photoOverlayTitle}>Photo Overlay</Text>
                                    <Text style={styles.photoOverlaySubtitle}>Customize how your event branding appears on photos</Text>
                                    <TouchableOpacity onPress={() => setShowOverlayGuidelines(true)}>
                                        <Text style={styles.photoOverlayGuidelinesLink}>
                                            Overlay Guidelines
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                                <View style={styles.photoOverlayPreviewBox}>
                                    {/* Preview Image with Overlay */}
                                    <View style={styles.photoOverlayPreviewImageBox}>
                                        {step1Data.overlay ? (
                                            <>
                                                <Image
                                                    source={{ uri: overlayPreviewUrl || '' }}
                                                    style={styles.photoOverlayPreviewImage}
                                                />
                                                <TouchableOpacity
                                                    onPress={handleRemoveOverlay}
                                                    style={styles.photoOverlayRemoveButton}
                                                >
                                                    <X size={wp(5)} color="#3DA9B7" />
                                                </TouchableOpacity>
                                            </>
                                        ) : (
                                            <Text style={styles.photoOverlayPreviewPlaceholder}>please select overlay</Text>
                                        )}
                                    </View>
                                    {/* Overlay Name Button or Input */}
                                    <View style={styles.photoOverlayNameBox}>
                                        {showOverlayNameInput ? (
                                            <>
                                                <TextInput
                                                    style={styles.photoOverlayNameInput}
                                                    placeholder="Enter overlay name"
                                                    value={overlayNameValue}
                                                    onChangeText={text => {
                                                        setOverlayNameValue(text);
                                                        updateStep1Data({ overlayName: text });
                                                    }}
                                                    onBlur={() => setShowOverlayNameInput(false)}
                                                    autoFocus
                                                />
                                                <TouchableOpacity onPress={() => setShowOverlayNameInput(false)}>
                                                    <Text style={styles.photoOverlayNameDone}>Done</Text>
                                                </TouchableOpacity>
                                            </>
                                        ) : (
                                            <TouchableOpacity
                                                style={styles.photoOverlayNameButton}
                                                onPress={() => {
                                                    if (step1Data.overlay) {
                                                        setShowOverlayNameInput(true)
                                                    }
                                                }}
                                            >
                                                <Text style={styles.photoOverlayNameButtonText}>
                                                    {overlayNameValue
                                                        ? overlayNameValue
                                                        : 'Name Overlay'}
                                                </Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                </View>
                                {/* Upload Overlay Template */}
                                <TouchableOpacity
                                    style={styles.photoOverlayUploadButton}
                                    onPress={handleOverlayImagePick}
                                    activeOpacity={0.8}
                                >
                                    <View style={styles.photoOverlayUploadIconBox}>
                                        {/* You can use an icon here */}
                                        <View style={styles.photoOverlayUploadIconInnerBox}>
                                            <Calendar size={wp(7)} color="#333" />
                                        </View>
                                    </View>
                                    <Text style={styles.photoOverlayUploadTitle}>Upload Overlay Template</Text>
                                    <Text style={styles.photoOverlayUploadSubtitle}>
                                        Upload a custom overlay design (PNG with transparency)
                                    </Text>
                                    <Text style={styles.photoOverlayUploadDimensions}>
                                        Portrait: 1080×1920 px{'\n'}Landscape: 1920×1080 px
                                    </Text>
                                </TouchableOpacity>
                                {/* Available Overlays */}
                                <Text style={styles.photoOverlayAvailableTitle}>Available Overlays</Text>
                                {/* Button to open OverlaySelector modal */}
                                <TouchableOpacity
                                    style={styles.photoOverlayAvailableButton}
                                    onPress={() => setOverlaySelectorOpen(true)}
                                    activeOpacity={0.8}
                                >
                                    <Text style={styles.photoOverlayAvailableButtonText}>
                                        Click To See Available Overlays
                                    </Text>
                                </TouchableOpacity>
                                {/* OverlaySelector Modal */}

                                <OverlaySelector
                                    isOpen={overlaySelectorOpen}
                                    onClose={() => setOverlaySelectorOpen(false)}
                                    onSelect={(overlay) => {
                                        updateStep1Data({ overlayId: overlay.id, overlay: overlay.src });
                                        setOverlaySelectorOpen(false);
                                    }}
                                />

                                {/* Overlay Guidelines Modal */}
                                <OverlayGuidelinesModal open={showOverlayGuidelines} onClose={() => setShowOverlayGuidelines(false)} />
                            </View>
                        )}

                        {/* Buttons */}
                        <View style={styles.buttonRow}>
                            <TouchableOpacity
                                style={styles.secondaryButton}
                                onPress={() => {
                                    navigation.goBack();
                                    resetEventData();
                                }}
                            >
                                <Text style={styles.secondaryButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.primaryButton,
                                    !isStep1Valid && styles.primaryButtonDisabled
                                ]}
                                onPress={() => {
                                    if (isStep1Valid) {
                                        const editParam = eventId;
                                        navigation.navigate('CreateEventSecondStep' as never, {
                                            eventId: editParam
                                        } as never);
                                    }
                                }}
                                disabled={!isStep1Valid}
                            >
                                <Text style={styles.primaryButtonText}>
                                    {isEditMode ? 'Save & Continue' : 'Next'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default CreateEventScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F6FEFF',
    },
    scrollContainer: {
        flexGrow: 1,
        padding: wp(2),
        paddingTop: hp(2),
        backgroundColor: '#F6FEFF',
    },
    card: {
        backgroundColor: 'white',
        borderRadius: wp(4),
        padding: wp(8),
        marginBottom: hp(10),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    collapsibleHeader: {
        backgroundColor: '#F7FCFC',
        borderWidth: 1,
        borderColor: '#E5E5E5',
        borderRadius: wp(4),
        marginBottom: hp(2),
    },
    collapsibleHeaderOpen: {
        backgroundColor: '#F7FCFC',
    },
    collapsibleHeaderClosed: {
        backgroundColor: 'white',
    },
    collapsibleContent: {
        paddingHorizontal: wp(4),
        paddingVertical: hp(2),
    },
    collapsibleHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    eventDetailsTitle: {
        fontSize: wp(4.5),
        fontWeight: 'bold',
        color: '#3DA9B7',
        textAlign: 'left',
        marginBottom: hp(.5)
    },
    eventDetailsSubtitle: {
        fontSize: wp(3),
        color: 'rgba(0, 0, 0, 0.5)',
        textAlign: 'left',
    },
    eventDetailsContent: {
        flexDirection: 'column',
        gap: hp(2),
    },
    input: {
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: wp(3),
        paddingHorizontal: wp(4),
        paddingVertical: hp(2),
        fontSize: wp(4.5),
        backgroundColor: 'white',
    },
    select: {
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: wp(3),
        paddingHorizontal: wp(4),
        paddingVertical: hp(2),
        backgroundColor: 'white',
        marginTop: hp(1),
    },
    datePickerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: wp(3),
        paddingHorizontal: wp(4),
        paddingVertical: hp(2),
        backgroundColor: 'white',
        marginTop: hp(1),
    },
    datePickerText: {
        flex: 1,
        color: '#374151',
        marginLeft: wp(2),
        fontSize: wp(4.5),
    },
    datePickerTextPlaceholder: {
        flex: 1,
        color: '#9CA3AF',
        marginLeft: wp(2),
        fontSize: wp(4.5),
    },
    label: {
        fontSize: wp(4),
        fontWeight: '500',
        marginBottom: hp(0.5),
        color: '#374151',
    },
    labelWithOpacity: {
        color: 'rgba(0, 0, 0, 0.5)',
    },
    required: {
        color: '#EF4444',
    },
    errorText: {
        fontSize: wp(3.5),
        color: '#EF4444',
        marginTop: hp(0.5),
        paddingLeft: wp(2),
    },
    successText: {
        fontSize: wp(3.5),
        color: '#10B981',
        marginTop: hp(0.5),
        paddingLeft: wp(2),
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: hp(4),
    },
    primaryButton: {
        backgroundColor: '#3DA9B7',
        borderRadius: wp(3),
        paddingHorizontal: wp(10),
        paddingVertical: hp(2),
        alignItems: 'center',
    },
    primaryButtonDisabled: {
        backgroundColor: '#9CA3AF',
    },
    primaryButtonText: {
        color: 'white',
        fontSize: wp(4),
        fontWeight: '500',
    },
    secondaryButton: {
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: wp(3),
        paddingHorizontal: wp(8),
        paddingVertical: hp(2),
        backgroundColor: 'white',
    },
    secondaryButtonText: {
        color: '#6B7280',
        fontSize: wp(4),
        fontWeight: '500',
    },
    checkboxRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: wp(2),
    },
    checkbox: {
        marginRight: wp(2),
    },
    checkboxLabel: {
        fontSize: wp(4),
        color: '#0D9488',
        fontWeight: '500',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: wp(4),
        padding: wp(4),
        margin: wp(5),
        maxWidth: '90%',
        width: '90%',
        maxHeight: hp(60),
    },
    calendarModalContent: {
        backgroundColor: 'white',
        borderRadius: wp(4),
        paddingVertical: hp(2),
        paddingHorizontal: wp(2),
        width: '90%',
        maxWidth: 420,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 6,
    },
    overlayPreview: {
        height: hp(25),
        borderRadius: wp(4),
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: hp(1.5),
        overflow: 'hidden',
    },
    uploadArea: {
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: '#0D9488',
        borderRadius: wp(4),
        padding: wp(6),
        alignItems: 'center',
        backgroundColor: '#F8FAFB',
        marginBottom: hp(2),
    },
    uploadText: {
        fontSize: wp(4),
        fontWeight: '600',
        color: '#374151',
        marginTop: hp(1),
        marginBottom: hp(0.5),
    },
    uploadSubtext: {
        fontSize: wp(3.5),
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: hp(0.5),
    },
    uploadDimensions: {
        fontSize: wp(3.5),
        color: '#6B7280',
        textAlign: 'center',
    },
    // Custom styles for new design
    eventTypePickerContainer: {
        marginBottom: hp(2),
    },
    eventTypeText: {
        color: '#333',
        fontSize: wp(4.5),
    },
    eventTypeTextPlaceholder: {
        color: '#9CA3AF',
        fontSize: wp(4.5),
    },
    eventTypeCustomInput: {
        marginTop: hp(1),
    },
    eventTypeModalItem: {
        paddingVertical: hp(2),
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E5'
    },
    eventTypeModalItemText: {
        fontSize: wp(4.5),
        color: '#333'
    },
    timePickerContainer: {
        marginBottom: hp(2),
    },
    timePickerSelect: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingLeft: wp(3),
    },
    timePickerSelectDisabled: {
        backgroundColor: '#F3F4F6'
    },
    timePickerText: {
        color: '#333',
        fontSize: wp(4.5),
    },
    timePickerTextPlaceholder: {
        color: '#9CA3AF',
        fontSize: wp(3.5),
    },
    timePickerTextWithIcon: {
        marginLeft: wp(2),
    },
    timePickerModalItem: {
        paddingVertical: hp(2),
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E5'
    },
    timePickerModalItemText: {
        fontSize: wp(4.5),
        color: '#333'
    },
    endTimePickerRow: {
        marginBottom: hp(2),
    },
    endTimePickerInnerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: wp(3),
    },
    endTimeSwitchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: wp(2),
    },
    endTimeSwitch: {
        marginRight: wp(2),
    },
    endTimeSwitchText: {
        fontSize: wp(3.5),
        color: '#3DA9B7',
        fontWeight: '500',
    },
    twentyFourHourInfoBox: {
        marginTop: hp(1),
        paddingLeft: wp(2),
        borderWidth: 1,
        borderColor: '#3DA9B7',
        borderRadius: 8,
        backgroundColor: '#F7FCFC',
        paddingVertical: hp(1),
        paddingHorizontal: wp(3),
    },
    twentyFourHourInfoBoxTitle: {
        fontWeight: 'bold',
        color: '#3DA9B7',
        fontSize: wp(4),
    },
    twentyFourHourInfoBoxValue: {
        fontWeight: 'normal',
        color: '#374151',
    },
    endTimeSelectedText: {
        fontSize: wp(3.5),
        color: '#6B7280',
        marginTop: hp(0.5),
        paddingLeft: wp(2),
    },
    endTimeErrorText: {
        fontSize: wp(3.5),
        color: '#EF4444',
        marginTop: hp(0.5),
        paddingLeft: wp(2),
    },
    // Photo Overlay Section
    photoOverlayHeader: {
        borderWidth: 1,
        borderColor: '#E5E5E5',
        borderRadius: 8,
        marginTop: hp(3),
    },
    photoOverlayHeaderOpen: {
        backgroundColor: '#F7FCFC',
    },
    photoOverlayHeaderClosed: {
        backgroundColor: 'white',
    },
    photoOverlayHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: wp(4),
        paddingVertical: hp(2),
    },
    photoOverlayHeaderTitle: {
        fontSize: wp(4.5),
        fontWeight: 'bold',
        color: '#3DA9B7',
        textAlign: 'left',
    },
    photoOverlayHeaderSubtitle: {
        fontSize: wp(3),
        color: 'rgba(0,0,0,0.6)',
        marginTop: hp(0.5),
    },
    photoOverlayContent: {
        borderRadius: 8,
        marginTop: hp(2),
        flexDirection: 'column',
        width: '100%',
        backgroundColor: 'transparent'
    },
    photoOverlayTitleBox: {
        alignItems: 'center',
        marginBottom: hp(1.5),
        width: '100%',
    },
    photoOverlayTitle: {
        fontSize: wp(6),
        fontWeight: 'bold',
        color: '#3DA9B7',
    },
    photoOverlaySubtitle: {
        fontSize: wp(4),
        color: '#808080',
        marginTop: hp(0.5),
    },
    photoOverlayGuidelinesLink: {
        color: '#3DA9B7',
        fontWeight: '400',
        fontSize: wp(4.5),
        marginTop: hp(0.5),
        textDecorationLine: 'underline'
    },
    photoOverlayPreviewBox: {
        backgroundColor: '#3DA9B7',
        width: '100%',
        padding: wp(3),
        marginBottom: hp(2),
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center'
    },
    photoOverlayPreviewImageBox: {
        height: hp(30),
        borderRadius: 8,
        overflow: 'hidden',
        backgroundColor: '#E5E7EB',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: hp(2),
        position: 'relative',
        width: '100%'
    },
    photoOverlayPreviewImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'contain'
    },
    photoOverlayRemoveButton: {
        position: 'absolute',
        top: hp(1),
        right: wp(2),
        backgroundColor: 'rgba(255,255,255,0.8)',
        borderRadius: 999,
        padding: wp(1.5),
        zIndex: 10
    },
    photoOverlayPreviewPlaceholder: {
        color: '#808080',
        fontSize: wp(4.5),
        fontWeight: '500'
    },
    photoOverlayNameBox: {
        width: '100%',
        alignItems: 'center',
        marginBottom: hp(1.5)
    },
    photoOverlayNameInput: {
        width: '100%',
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#E6E6E6',
        borderRadius: 8,
        paddingVertical: hp(2),
        paddingHorizontal: wp(3),
        color: '#333333',
        fontWeight: '500',
        fontSize: wp(4.5),
        marginBottom: hp(1)
    },
    photoOverlayNameDone: {
        marginTop: hp(0.5),
        fontSize: wp(3.5),
        color: '#3DA9B7',
        textDecorationLine: 'underline'
    },
    photoOverlayNameButton: {
        width: '100%',
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#E6E6E6',
        borderRadius: 8,
        paddingVertical: hp(2.5),
        alignItems: 'center',
        marginBottom: hp(1),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1
    },
    photoOverlayNameButtonText: {
        color: '#333333',
        fontWeight: '500',
        fontSize: wp(4.5),
    },
    photoOverlayUploadButton: {
        width: '100%',
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: '#3DA9B7',
        borderRadius: 8,
        alignItems: 'center',
        paddingVertical: hp(3),
        marginBottom: hp(2),
        backgroundColor: '#F8FAFB'
    },
    photoOverlayUploadIconBox: {
        marginBottom: hp(1),
    },
    photoOverlayUploadIconInnerBox: {
        width: wp(8),
        height: wp(8),
        alignItems: 'center',
        justifyContent: 'center'
    },
    photoOverlayUploadTitle: {
        fontWeight: 'bold',
        color: '#333333',
        fontSize: wp(4),
        marginBottom: hp(0.5)
    },
    photoOverlayUploadSubtitle: {
        fontSize: wp(3.5),
        color: '#808080',
        marginBottom: hp(0.5),
        textAlign: 'center',
        paddingHorizontal: wp(5)
    },
    photoOverlayUploadDimensions: {
        color: '#808080',
        fontSize: wp(3.5),
        textAlign: 'center'
    },
    photoOverlayAvailableTitle: {
        fontSize: wp(4.5),
        color: 'black',
        opacity: 0.8,
        fontWeight: 'bold',
        marginBottom: hp(1),
        textAlign: 'left'
    },
    photoOverlayAvailableButton: {
        width: '100%',
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#E6E6E6',
        borderRadius: 8,
        paddingVertical: hp(2.5),
        alignItems: 'center',
        marginBottom: hp(1.5),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1
    },
    photoOverlayAvailableButtonText: {
        color: '#3DA9B7',
        fontWeight: 'bold',
        fontSize: wp(4.5),
    },
    overlaySelectorCloseButton: {
        position: 'absolute',
        top: hp(1),
        right: wp(2),
        zIndex: 10
    },
    overlaySelectorCloseButtonText: {
        fontSize: wp(8),
        color: '#6B7280'
    }
});
