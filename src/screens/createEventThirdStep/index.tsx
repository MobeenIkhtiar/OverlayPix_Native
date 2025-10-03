// import React, { useState, useEffect } from 'react';
// import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Image, Alert } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import { useRoute, useNavigation } from '@react-navigation/native';
// import { launchImageLibrary } from 'react-native-image-picker';
// import Header from '../../components/Header';
// import Stepper from '../../components/Stepper';
// import { useCreateEvent } from '../../hooks/useCreateEvent';
// import Loader from '../../components/Loader';
// import ColorPickerModal from '../../components/ColorPickerModal';
// import { wp, hp } from '../../contants/StyleGuide';

// const CreateEventThirdStep: React.FC = () => {
//     const [colorPickerOpen, setColorPickerOpen] = useState(false);
//     const [lastUsedColors, setLastUsedColors] = useState<string[]>(['#3DA9B7']);
//     const [isEditMode, setIsEditMode] = useState<boolean>(false);
//     const [loading, setLoading] = useState<boolean>(false);
//     const [eventId, setEventId] = useState<string>('');
//     const [hostName, setHostName] = useState<string>('');

//     const route = useRoute();
//     const navigation = useNavigation();
//     const { step1Data, step2Data, step3Data, updateStep3Data, updateEvent, updateStep4Data } = useCreateEvent();

//     // Get edit parameter from route params
//     const editParam = (route.params as any)?.edit;

//     // Check if we're in edit mode by checking route params and step3Data
//     useEffect(() => {
//         if (editParam) {
//             setIsEditMode(true);
//             setEventId(editParam)
//         } else {
//             setIsEditMode(false);
//         }
//     }, [editParam, step3Data.brandColor]);

//     const handleImageChange = () => {
//         launchImageLibrary({
//             mediaType: 'photo',
//             quality: 1,
//         }, (response) => {
//             if (response.didCancel) {
//                 console.log('User cancelled image picker');
//             } else if (response.errorCode) {
//                 console.log('ImagePicker Error: ', response.errorMessage);
//                 Alert.alert('Error', 'Failed to pick image. Please try again.');
//             } else if (response.assets && response.assets[0]) {
//                 const asset = response.assets[0];
//                 console.log('selected event pic=>>>>>>>> ', asset);
//                 updateStep3Data({
//                     eventPicture: asset.uri || '',
//                     eventPictureFile: asset as any
//                 });
//             }
//         });
//     };

//     // Separate function for save/next
//     const handleSave = async () => {
//         // If in edit mode, do not navigate to the fourth step
//         if (isEditMode && eventId) {
//             setLoading(true)
//             await updateEvent(eventId);
//             (navigation as any).navigate('Dashboard', { eventId });
//             setLoading(false)
//             return;
//         }
//         updateStep4Data({ discountPrice: 0 })
//         if (editParam) {
//             (navigation as any).navigate('CreateEventFourthStep', { edit: editParam });
//         } else {
//             (navigation as any).navigate('CreateEventFourthStep');
//         }
//     };

//     return (
//         <SafeAreaView style={styles.container}>
//             <ScrollView
//                 style={styles.scrollView}
//                 contentContainerStyle={styles.scrollContent}
//                 showsVerticalScrollIndicator={false}
//             >
//                 <Header
//                     title={isEditMode ? "Edit Event" : "Create Event"}
//                     subtitle=""
//                     logoHover={true}
//                     setUserName={setHostName}
//                 />
//                 {/* stepper */}
//                 <Stepper steps={4} activeStep={3} />
//                 <View style={styles.mainCard}>

//                     <View style={styles.headerSection}>
//                         <Text style={styles.mainTitle}>
//                             Event Page Branding
//                         </Text>
//                         <Text style={styles.mainSubtitle}>
//                             Add your event picture and brand color
//                         </Text>
//                     </View>

//                     {/* Brand Color Section */}
//                     <View style={styles.brandColorSection}>
//                         <Text style={styles.sectionTitle}>
//                             Brand Color
//                         </Text>
//                         <View style={styles.colorPickerRow}>
//                             {/* Color preview box */}
//                             <View
//                                 style={[styles.colorPreview, { backgroundColor: step3Data.brandColor }]}
//                             />
//                             {/* Custom color picker box */}
//                             <TouchableOpacity
//                                 style={styles.colorPickerButton}
//                                 onPress={() => setColorPickerOpen(true)}
//                             >
//                                 <View
//                                     style={[styles.colorPickerInner, { backgroundColor: step3Data.brandColor }]}
//                                 />
//                             </TouchableOpacity>
//                             <ColorPickerModal
//                                 open={colorPickerOpen}
//                                 color={step3Data.brandColor}
//                                 onChange={color => {
//                                     console.log(' color =>>>>>>', step3Data.brandColor)
//                                     setLastUsedColors(prev => {
//                                         const filtered = prev.filter(c => c !== color);
//                                         return [color, ...filtered].slice(0, 12);
//                                     });
//                                 }}
//                                 onClose={() => setColorPickerOpen(false)}
//                                 lastUsedColors={lastUsedColors}
//                             />
//                         </View>
//                     </View>

//                     {/* Typography Section */}
//                     <View style={styles.typographySection}>
//                         <Text style={styles.sectionTitle}>
//                             Typography
//                         </Text>
//                         <View style={styles.typographyFields}>
//                             {/* Font Family Dropdown */}
//                             <View style={styles.fieldContainer}>
//                                 <Text style={styles.fieldLabel}>Font Family</Text>
//                                 <View style={styles.pickerWrapper}>
//                                     <TouchableOpacity style={styles.picker}>
//                                         <Text style={styles.pickerText}>{step3Data.fontFamily}</Text>
//                                     </TouchableOpacity>
//                                 </View>
//                             </View>

//                             {/* Font Weight Dropdown */}
//                             <View style={styles.fieldContainer}>
//                                 <Text style={styles.fieldLabel}>Font Weight</Text>
//                                 <View style={styles.pickerWrapper}>
//                                     <TouchableOpacity style={styles.picker}>
//                                         <Text style={styles.pickerText}>{step3Data.fontWeight.charAt(0).toUpperCase() + step3Data.fontWeight.slice(1)}</Text>
//                                     </TouchableOpacity>
//                                 </View>
//                             </View>

//                             {/* Font Size Dropdown */}
//                             <View style={styles.fieldContainer}>
//                                 <Text style={styles.fieldLabel}>Font Size</Text>
//                                 <View style={styles.pickerWrapper}>
//                                     <TouchableOpacity style={styles.picker}>
//                                         <Text style={styles.pickerText}>{step3Data.fontSize}px</Text>
//                                     </TouchableOpacity>
//                                 </View>
//                             </View>
//                         </View>
//                     </View>

//                     {/* Event Image Upload Section */}
//                     <View style={styles.uploadSection}>
//                         <Text style={styles.uploadTitle}>Event Page Picture Upload</Text>
//                         <TouchableOpacity
//                             style={styles.uploadContainer}
//                             onPress={handleImageChange}
//                             activeOpacity={0.7}
//                         >
//                             {step3Data.eventPicture ? (
//                                 <Image
//                                     source={{ uri: step3Data.eventPicture }}
//                                     style={styles.uploadedImage}
//                                     resizeMode="contain"
//                                 />
//                             ) : (
//                                 <View style={styles.uploadPlaceholder}>
//                                     <Text style={styles.uploadPlaceholderText}>
//                                         Select Event Picture
//                                     </Text>
//                                 </View>
//                             )}
//                             <View style={styles.uploadOverlay}>
//                                 <View style={styles.uploadButton}>
//                                     <Text style={styles.uploadButtonText}>📤</Text>
//                                     <Text style={styles.uploadButtonLabel}>Upload Event Image</Text>
//                                     <Text style={styles.uploadButtonSubLabel}>
//                                         Choose File
//                                     </Text>
//                                 </View>
//                             </View>
//                         </TouchableOpacity>
//                     </View>

//                     {/* Event Page Preview Section */}
//                     <View style={styles.previewSection}>
//                         <Text style={styles.previewTitle}>Event Page Preview</Text>
//                         <Text style={styles.previewSubtitle}>See how your Event Page will appear</Text>
//                         <Text style={styles.previewWelcome}>Welcome to</Text>
//                         <Text
//                             style={[
//                                 styles.previewEventName,
//                                 {
//                                     color: step3Data.brandColor || "#666666",
//                                     fontSize: step3Data.fontSize ? parseInt(step3Data.fontSize, 10) : 18,
//                                     fontWeight: (step3Data.fontWeight as any) || "500",
//                                     fontFamily: step3Data.fontFamily || "System"
//                                 }
//                             ]}
//                         >
//                             {step1Data?.name}
//                         </Text>

//                         {/* Event Card Preview */}
//                         <View style={styles.previewCard}>
//                             {step3Data.eventPicture ? (
//                                 <Image
//                                     source={{ uri: step3Data.eventPicture }}
//                                     style={styles.previewImage}
//                                     resizeMode="contain"
//                                 />
//                             ) : (
//                                 <View style={styles.previewImagePlaceholder}>
//                                     <Text style={styles.previewImagePlaceholderText}>
//                                         No picture selected
//                                     </Text>
//                                 </View>
//                             )}
//                             <View style={styles.previewCardContent}>
//                                 <View style={styles.previewCardRow}>
//                                     <Text style={styles.previewCardIcon}>🎨</Text>
//                                     {step2Data.plan.photosPerGuest === 0 ? (
//                                         <Text style={styles.previewCardText}>0 pictures taken</Text>
//                                     ) : (
//                                         <Text style={styles.previewCardText}>{step2Data.plan.photosPerGuest} out of {step2Data.plan.photosPerGuest} pictures</Text>
//                                     )}
//                                 </View>
//                                 <Text style={styles.previewCardHost}>Hosted by The {hostName}</Text>
//                             </View>
//                         </View>

//                         {/* Action Buttons */}
//                         <View style={styles.previewActions}>
//                             <TouchableOpacity style={styles.previewAcceptButton}>
//                                 <Text style={styles.previewAcceptButtonText}>Accept and Continue</Text>
//                             </TouchableOpacity>
//                             <TouchableOpacity style={styles.previewDeclineButton}>
//                                 <Text style={styles.previewDeclineButtonText}>Decline</Text>
//                             </TouchableOpacity>
//                         </View>
//                     </View>

//                 </View>

//                 {/* Bottom padding for fixed footer */}
//                 <View style={styles.bottomPadding} />
//             </ScrollView>

//             {/* Fixed Bottom Buttons */}
//             <View style={styles.fixedBottom}>
//                 <TouchableOpacity
//                     style={styles.previousButton}
//                     onPress={() => navigation.goBack()}
//                 >
//                     <Text style={styles.previousButtonText}>Previous</Text>
//                 </TouchableOpacity>
//                 <TouchableOpacity
//                     style={[styles.nextButton, (isEditMode && loading) && styles.nextButtonDisabled]}
//                     onPress={handleSave}
//                     disabled={isEditMode && loading}
//                 >
//                     {isEditMode && loading ? (
//                         <View style={styles.loadingContainer}>
//                             <Loader size="small" color="#ffffff" />
//                             <Text style={styles.nextButtonText}>Saving...</Text>
//                         </View>
//                     ) : (
//                         <Text style={styles.nextButtonText}>{isEditMode ? 'Save & Continue' : 'Next'}</Text>
//                     )}
//                 </TouchableOpacity>
//             </View>
//         </SafeAreaView>
//     );
// };

// const styles = StyleSheet.create({
//     container: {
//         flex: 1,
//         backgroundColor: '#F6FEFF',
//     },
//     scrollView: {
//         flex: 1,
//     },
//     scrollContent: {
//         padding: wp(3),
//         paddingBottom: hp(12),
//     },
//     mainCard: {
//         backgroundColor: '#FFFFFF',
//         paddingHorizontal: wp(4),
//         paddingVertical: hp(2),
//         borderRadius: wp(2.5),
//         width: '100%',
//         shadowColor: '#000',
//         shadowOffset: { width: 0, height: 2 },
//         shadowOpacity: 0.1,
//         shadowRadius: 4,
//         elevation: 3,
//         marginBottom: hp(1),
//     },
//     headerSection: {
//         marginBottom: hp(3),
//     },
//     mainTitle: {
//         fontSize: wp(5),
//         fontWeight: 'bold',
//         color: '#3DA9B7',
//         marginBottom: hp(0.5),
//     },
//     mainSubtitle: {
//         fontSize: wp(3.5),
//         color: '#666666',
//     },
//     brandColorSection: {
//         marginBottom: hp(3),
//     },
//     sectionTitle: {
//         fontSize: wp(4),
//         fontWeight: '600',
//         color: '#666666',
//         marginBottom: hp(1.5),
//     },
//     colorPickerRow: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         gap: wp(3),
//     },
//     colorPreview: {
//         width: wp(12),
//         height: wp(12),
//         borderRadius: wp(2),
//         borderWidth: 2,
//         borderColor: '#E5E5E5',
//     },
//     colorPickerButton: {
//         width: wp(20),
//         height: hp(5),
//         borderWidth: 1,
//         borderColor: '#DFDFDF',
//         borderRadius: wp(2),
//         backgroundColor: '#FFFFFF',
//         alignItems: 'center',
//         justifyContent: 'center',
//         padding: wp(0.5),
//     },
//     colorPickerInner: {
//         width: '100%',
//         height: '100%',
//         borderRadius: wp(1.5),
//         borderWidth: 1,
//         borderColor: '#787878',
//     },
//     typographySection: {
//         marginBottom: hp(3),
//     },
//     typographyFields: {
//         gap: hp(1.5),
//     },
//     fieldContainer: {
//         gap: hp(0.5),
//     },
//     fieldLabel: {
//         fontSize: wp(3.5),
//         fontWeight: '500',
//         color: '#666666',
//     },
//     pickerWrapper: {
//         width: '100%',
//     },
//     picker: {
//         width: '100%',
//         borderWidth: 1,
//         borderColor: '#E5E5E5',
//         borderRadius: wp(1.5),
//         paddingHorizontal: wp(4),
//         paddingVertical: hp(1.5),
//         backgroundColor: '#FFFFFF',
//     },
//     pickerText: {
//         fontSize: wp(3.5),
//         color: '#666666',
//     },
//     uploadSection: {
//         marginBottom: hp(3),
//     },
//     uploadTitle: {
//         fontSize: wp(4),
//         fontWeight: '600',
//         color: '#666666',
//         marginBottom: hp(2),
//     },
//     uploadContainer: {
//         width: '100%',
//         height: hp(20),
//         borderRadius: wp(4),
//         overflow: 'hidden',
//         position: 'relative',
//     },
//     uploadedImage: {
//         width: '100%',
//         height: '100%',
//     },
//     uploadPlaceholder: {
//         width: '100%',
//         height: '100%',
//         backgroundColor: '#F5F5F5',
//         alignItems: 'center',
//         justifyContent: 'center',
//         paddingTop: hp(3),
//     },
//     uploadPlaceholderText: {
//         fontSize: wp(4),
//         color: '#CCCCCC',
//         fontWeight: '600',
//     },
//     uploadOverlay: {
//         position: 'absolute',
//         bottom: 0,
//         left: 0,
//         right: 0,
//         alignItems: 'center',
//         justifyContent: 'flex-end',
//         paddingBottom: hp(1),
//     },
//     uploadButton: {
//         backgroundColor: 'rgba(255, 255, 255, 0.3)',
//         borderRadius: wp(3),
//         paddingHorizontal: wp(3),
//         paddingVertical: hp(1.5),
//         alignItems: 'center',
//         justifyContent: 'center',
//     },
//     uploadButtonText: {
//         fontSize: wp(6),
//         marginBottom: hp(0.5),
//     },
//     uploadButtonLabel: {
//         fontSize: wp(2),
//         fontWeight: '600',
//         color: '#000000',
//         marginBottom: hp(0.25),
//     },
//     uploadButtonSubLabel: {
//         fontSize: wp(1.8),
//         color: '#000000',
//     },
//     previewSection: {
//         backgroundColor: '#FFFFFF',
//         borderWidth: 1,
//         borderColor: '#E3F6F8',
//         borderRadius: wp(4),
//         width: '100%',
//         alignItems: 'center',
//         shadowColor: '#000',
//         shadowOffset: { width: 0, height: 1 },
//         shadowOpacity: 0.05,
//         shadowRadius: 2,
//         elevation: 2,
//         marginBottom: hp(2),
//         marginTop: hp(4),
//         padding: wp(4),
//     },
//     previewTitle: {
//         fontSize: wp(5),
//         fontWeight: 'bold',
//         color: '#3DA9B7',
//         marginBottom: hp(0.5),
//         textAlign: 'center',
//     },
//     previewSubtitle: {
//         fontSize: wp(3.5),
//         color: '#666666',
//         marginBottom: hp(2),
//         textAlign: 'center',
//     },
//     previewWelcome: {
//         fontSize: wp(3.5),
//         fontWeight: 'bold',
//         color: '#3DA9B7',
//         textAlign: 'center',
//         marginTop: hp(1),
//     },
//     previewEventName: {
//         marginBottom: hp(2),
//         textAlign: 'center',
//     },
//     previewCard: {
//         width: '100%',
//         paddingHorizontal: wp(4),
//         paddingVertical: hp(1),
//         backgroundColor: '#FFFFFF',
//         borderWidth: 1,
//         borderColor: '#C6F1F6',
//         borderRadius: wp(3),
//         overflow: 'hidden',
//         marginBottom: hp(3),
//         alignItems: 'center',
//     },
//     previewImage: {
//         width: '100%',
//         height: hp(12),
//         borderRadius: wp(2),
//     },
//     previewImagePlaceholder: {
//         width: '100%',
//         height: hp(12),
//         backgroundColor: '#F5F5F5',
//         borderRadius: wp(2),
//         alignItems: 'center',
//         justifyContent: 'center',
//     },
//     previewImagePlaceholderText: {
//         fontSize: wp(4),
//         color: '#CCCCCC',
//         fontWeight: '600',
//     },
//     previewCardContent: {
//         alignItems: 'center',
//         paddingVertical: hp(2),
//     },
//     previewCardRow: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         marginBottom: hp(0.5),
//     },
//     previewCardIcon: {
//         fontSize: wp(4.5),
//         marginRight: wp(2),
//     },
//     previewCardText: {
//         fontSize: wp(4.5),
//         fontWeight: '600',
//         color: '#666666',
//     },
//     previewCardHost: {
//         fontSize: wp(2.5),
//         color: '#8B8B8B',
//     },
//     previewActions: {
//         width: '100%',
//         borderWidth: 1,
//         borderColor: '#C6F1F6',
//         borderRadius: wp(3),
//         padding: wp(2),
//         gap: hp(1.5),
//     },
//     previewAcceptButton: {
//         width: '100%',
//         backgroundColor: '#3DA9B7',
//         paddingVertical: hp(1.5),
//         borderRadius: wp(2),
//         shadowColor: '#000',
//         shadowOffset: { width: 0, height: 1 },
//         shadowOpacity: 0.1,
//         shadowRadius: 2,
//         elevation: 2,
//     },
//     previewAcceptButtonText: {
//         color: '#FFFFFF',
//         fontSize: wp(2.5),
//         fontWeight: '600',
//         textAlign: 'center',
//     },
//     previewDeclineButton: {
//         width: '100%',
//         backgroundColor: 'transparent',
//         borderWidth: 1,
//         borderColor: '#C8C6C6',
//         paddingVertical: hp(1.5),
//         borderRadius: wp(2),
//     },
//     previewDeclineButtonText: {
//         color: '#8B8B8B',
//         fontSize: wp(2.5),
//         fontWeight: '500',
//         textAlign: 'center',
//     },
//     bottomPadding: {
//         height: hp(10),
//     },
//     fixedBottom: {
//         position: 'absolute',
//         left: 0,
//         right: 0,
//         bottom: 0,
//         flexDirection: 'row',
//         justifyContent: 'space-between',
//         backgroundColor: '#FFFFFF',
//         borderWidth: 1,
//         borderColor: '#C6F1F6',
//         borderRadius: wp(3),
//         padding: wp(2),
//         marginHorizontal: wp(3),
//         marginBottom: hp(2),
//         shadowColor: '#000',
//         shadowOffset: { width: 0, height: -2 },
//         shadowOpacity: 0.04,
//         shadowRadius: 8,
//         elevation: 8,
//     },
//     previousButton: {
//         borderWidth: 1,
//         borderColor: '#E6E6E6',
//         borderRadius: wp(1.5),
//         paddingHorizontal: wp(8),
//         paddingVertical: hp(1.5),
//         backgroundColor: '#FFFFFF',
//     },
//     previousButtonText: {
//         color: '#808080',
//         fontSize: wp(3.5),
//         fontWeight: '500',
//     },
//     nextButton: {
//         borderRadius: wp(1.5),
//         paddingHorizontal: wp(10),
//         paddingVertical: hp(1.5),
//         backgroundColor: '#3DA9B7',
//         shadowColor: '#000',
//         shadowOffset: { width: 0, height: 2 },
//         shadowOpacity: 0.15,
//         shadowRadius: 4,
//         elevation: 3,
//     },
//     nextButtonDisabled: {
//         opacity: 0.6,
//     },
//     nextButtonText: {
//         color: '#FFFFFF',
//         fontSize: wp(3.5),
//         fontWeight: '500',
//     },
//     loadingContainer: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         justifyContent: 'center',
//         gap: wp(2),
//     },
// });

// export default CreateEventThirdStep;
