// import React, { useState, useEffect } from 'react';
// import { View, Text, TouchableOpacity, ScrollView, TextInput, StyleSheet } from 'react-native';
// import { useRoute } from '@react-navigation/native';
// import Header from '../../components/Header';
// import Stepper from '../../components/Stepper';
// import { ChevronDown, ChevronUp } from 'lucide-react-native';
// import Loader from '../../components/Loader';
// import { formatPrice } from '../../utils/HelperFunctions';
// import { planService } from '../../services/planService';
// import { useCreateEvent } from '../../hooks/useCreateEvent';
// import { Plan } from '../../types/plan';
// import PlanCard from '../../components/PlanCard';
// import DaySelection from '../../components/DaySelection';
// import PlanDetailsCardSecondStep from '../../components/PlanDetailsCardSecondStep';
// import ToggleSwitch from '../../components/ToggleSwitch';
// import { wp, hp } from '../../contants/StyleGuide';
// import { SafeAreaView } from 'react-native-safe-area-context';

// const CreateEventSecondStep: React.FC = () => {
//     const route = useRoute();
//     // const navigation = useNavigation();
//     const [plansOpen, setPlansOpen] = useState<boolean>(true);
//     const [guestPhotosOpen, setGuestPhotosOpen] = useState<boolean>(false);
//     const [isEditMode, setIsEditMode] = useState<boolean>(false);
//     const [plans, setPlans] = useState<Plan[]>([]);
//     const [loading, setLoading] = useState<boolean>(true);
//     const [error, setError] = useState<string | null>(null);
//     const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
//     const [selectedStorage, setSelectedStorage] = useState<any>();
//     const [showPhotoPerguest, setShowPhotoPerguest] = useState<boolean>(true);
//     const { step2Data, updateStep2Data } = useCreateEvent();

//     // Get edit parameter from route params
//     const editParam = (route.params as any)?.edit;

//     // New: Error state for photosPerGuest > photoPool
//     const [photosPerGuestError, setPhotosPerGuestError] = useState<string | null>(null);

//     // Helper to round off photosPerGuest
//     const getRoundedPhotosPerGuest = (photoPool: number, guestLimit: number) => {
//         if (!guestLimit) return 0;
//         return Math.round(photoPool / guestLimit);
//     };

//     // Note: ScrollView in React Native handles scroll position automatically
//     // No need for manual scroll to top

//     // Fetch plans from API
//     useEffect(() => {
//         const fetchPlans = async () => {
//             try {
//                 setLoading(true);
//                 setError(null);
//                 const fetchedPlans = await planService.getPlans();

//                 // Sort plans by price ascending before setting state
//                 const sortedPlans = [...fetchedPlans].sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
//                 setPlans(sortedPlans);

//                 // Set default plan if no plan is selected
//                 if (!step2Data.plan.planId && sortedPlans.length > 0) {
//                     const defaultPlan = sortedPlans.find(plan => plan.name.toLowerCase().includes('free')) || sortedPlans[0];
//                     setSelectedPlan(defaultPlan);

//                     // Set selected storage to the first storage option of the default plan
//                     if (defaultPlan.storageOptions && defaultPlan.storageOptions.length > 0) {
//                         setSelectedStorage(defaultPlan.storageOptions[0]);
//                     }

//                     updatePlanData({
//                         planId: defaultPlan.id,
//                         basePlan: defaultPlan.price,
//                         guestLimit: defaultPlan.guestLimit,
//                         photoPool: defaultPlan.photoPool,
//                         photosPerGuest: getRoundedPhotosPerGuest(defaultPlan.photoPool, defaultPlan.guestLimit),
//                         storageDays: defaultPlan.defaultStorageDays,
//                         permissions: {
//                             canViewGallery: true,
//                             canSharePhotos: false,
//                             canDownload: false
//                         }
//                     });
//                 } else if (step2Data.plan.planId) {
//                     // If we have a plan ID, find and set the selected plan
//                     const currentPlan = sortedPlans.find(plan => plan.id === step2Data.plan.planId);
//                     if (currentPlan) {
//                         setSelectedPlan(currentPlan);

//                         // Set selected storage to the first storage option of the current plan
//                         if (currentPlan.storageOptions && currentPlan.storageOptions.length > 0) {
//                             setSelectedStorage(currentPlan.storageOptions[0]);
//                         }
//                     }
//                 }
//             } catch (err) {
//                 setError('Failed to load plans. Please try again.');
//             } finally {
//                 setLoading(false);
//             }
//         };

//         fetchPlans();
//         // eslint-disable-next-line react-hooks/exhaustive-deps
//     }, []);

//     // Check if we're in edit mode by checking route params
//     useEffect(() => {
//         if (editParam) {
//             setIsEditMode(true);
//         } else {
//             setIsEditMode(false);
//         }
//     }, [editParam]);

//     // Update context when local state changes
//     const updatePlanData = (updates: Partial<typeof step2Data.plan>) => {
//         updateStep2Data({
//             plan: {
//                 ...step2Data.plan,
//                 ...updates
//             }
//         });
//     };

//     // Handle plan selection
//     const handlePlanSelect = (plan: Plan) => {
//         setSelectedPlan(plan);
//         updatePlanData({
//             planId: plan.id,
//             basePlan: plan.price,
//             guestLimit: plan.guestLimit,
//             photoPool: plan.photoPool,
//             finalPrice: plan.price,
//             photosPerGuest: getRoundedPhotosPerGuest(plan.photoPool, plan.guestLimit),
//             storageDays: plan.defaultStorageDays,
//             permissions: {
//                 canViewGallery: true,
//                 canSharePhotos: false,
//                 canDownload: false
//             }
//         });
//     };

//     // Calculate guest limit price (only for extra guests above base)
//     const calculateGuestLimitPrice = (): number => {
//         if (!selectedPlan) return 0;
//         const base = selectedPlan.guestLimit || 1;
//         const pricePerGuest = selectedPlan.guestLimitIncreasePricePerGuest || 0;
//         const extra = Math.max(0, step2Data.plan.guestLimit - base);
//         return extra * pricePerGuest;
//     };

//     // Calculate photo pool price (only for extra photos above base)
//     const calculatePhotoPoolPrice = (): number => {
//         if (!selectedPlan) return 0;
//         const base = selectedPlan.photoPool || 1;
//         const pricePerPhoto = selectedPlan.photoPoolLimitIncreasePricePerPhoto || 0;
//         const extra = Math.max(0, step2Data.plan.photoPool - base);
//         return extra * pricePerPhoto;
//     };

//     // Calculate storage duration price based on selected option
//     const calculateStorageDurationPrice = (): number => {
//         if (!selectedPlan?.storageOptions) return 0;
//         const currentOption = selectedPlan.storageOptions.find(option => option.days === step2Data.plan.storageDays);
//         if (!currentOption) return 0;
//         return currentOption.price || 0;
//     };

//     // --- Fix: Always include base plan price in finalPrice ---
//     React.useEffect(() => {
//         if (!selectedPlan) return;

//         const guestLimitPrice = calculateGuestLimitPrice();
//         const photoPoolPrice = calculatePhotoPoolPrice();
//         const storageDurationPrice = calculateStorageDurationPrice();

//         // Always include base plan price
//         const totalPrice = (selectedPlan.price || 0) + guestLimitPrice + photoPoolPrice + storageDurationPrice;

//         // Update all price fields as requested
//         updatePlanData({
//             finalPrice: Number(totalPrice?.toFixed(2)),
//             guestLimitPrice: Number(guestLimitPrice?.toFixed(2)),
//             photoPoolPrice: Number(photoPoolPrice?.toFixed(2)),
//             storageDaysPrice: Number(storageDurationPrice?.toFixed(2)),
//         });
//         // eslint-disable-next-line react-hooks/exhaustive-deps
//     }, [selectedPlan, step2Data.plan.guestLimit, step2Data.plan.photoPool, step2Data.plan.storageDays]);

//     // --- Fix: Keep photosPerGuest in sync with guestLimit and photoPool changes ---
//     useEffect(() => {
//         // Only adjust if the limit is enabled (photosPerGuest > 0)
//         if (step2Data.plan.photosPerGuest > 0) {
//             const maxPhotosPerGuest = Math.floor(step2Data.plan.photoPool / (step2Data.plan.guestLimit || 1));
//             if (step2Data.plan.photosPerGuest > maxPhotosPerGuest) {
//                 updatePlanData({ photosPerGuest: maxPhotosPerGuest });
//             }
//             // If maxPhotosPerGuest drops below 1, disable the toggle
//             if (maxPhotosPerGuest < 1) {
//                 updatePlanData({ photosPerGuest: 0 });
//             }
//         }
//         // eslint-disable-next-line react-hooks/exhaustive-deps
//     }, [step2Data.plan.guestLimit, step2Data.plan.photoPool]);

//     // --- New: Validate photosPerGuest is not greater than photoPool ---
//     useEffect(() => {
//         if (
//             typeof step2Data.plan.photosPerGuest === 'number' &&
//             typeof step2Data.plan.photoPool === 'number' &&
//             step2Data.plan.photosPerGuest > step2Data.plan.photoPool
//         ) {
//             setPhotosPerGuestError('Photos per guest cannot be greater than the total photo pool.');
//         } else {
//             setPhotosPerGuestError(null);
//         }
//     }, [step2Data.plan.photosPerGuest, step2Data.plan.photoPool]);

//     // Helper to chunk plans into rows of 2
//     const chunkPlans = (plansArr: Plan[], size: number): Plan[][] => {
//         const result: Plan[][] = [];
//         for (let i = 0; i < plansArr.length; i += size) {
//             result.push(plansArr.slice(i, i + size));
//         }
//         return result;
//     };

//     // Helper to get current storage option price
//     const getCurrentStorageOptionPrice = (): string => {
//         if (!selectedPlan?.storageOptions) {
//             return '$0';
//         }

//         const currentOption = selectedPlan.storageOptions.find(option => option.days === step2Data.plan.storageDays);
//         if (!currentOption) {
//             return '$0';
//         }

//         // Price is now a number, so we can directly use it
//         return currentOption.price === 0 ? '$0' : `$${currentOption.price}`;
//     };

//     // Show loader while loading plans
//     if (loading) {
//         return (
//             <View style={styles.loaderContainer}>
//                 <Loader />
//             </View>
//         );
//     }

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
//                 />
//                 {/* stepper */}
//                 <Stepper steps={4} activeStep={2} />
//                 <View style={styles.mainCard}>
//                     {/* plans dropdown */}
//                     <TouchableOpacity
//                         style={[styles.dropdownHeader, plansOpen ? styles.dropdownHeaderOpen : styles.dropdownHeaderClosed]}
//                         onPress={() => setPlansOpen((v) => !v)}
//                         activeOpacity={0.7}
//                     >
//                         <View style={styles.dropdownHeaderContent}>
//                             <View>
//                                 <Text style={styles.dropdownTitle}>Plans</Text>
//                                 <Text style={styles.dropdownSubtitle}>Choose a base plan and adjust limits</Text>
//                             </View>
//                             {plansOpen ? (
//                                 <ChevronUp width={wp(6)} height={wp(6)} color="#636565" />
//                             ) : (
//                                 <ChevronDown width={wp(6)} height={wp(6)} color="#636565" />
//                             )}
//                         </View>
//                     </TouchableOpacity>
//                     {plansOpen && (
//                         <View style={styles.plansContent}>
//                             <Text style={styles.sectionTitle}>Plans</Text>
//                             <Text style={styles.sectionSubtitle}>Choose a base plan and adjust limits</Text>

//                             {error && (
//                                 <View style={styles.errorContainer}>
//                                     <Text style={styles.errorText}>{error}</Text>
//                                 </View>
//                             )}

//                             {!error && plans?.length > 0 && (
//                                 <View style={styles.plansGrid}>
//                                     {chunkPlans(plans, 2).map((planRow, rowIdx) => (
//                                         <View key={rowIdx} style={styles.planRow}>
//                                             {planRow.map((plan, index) => (
//                                                 <PlanCard
//                                                     key={`${plan.name}-${index}`}
//                                                     plan={plan}
//                                                     selected={step2Data.plan.planId === plan.id}
//                                                     onClick={() => handlePlanSelect(plan)}
//                                                     isEditMode={isEditMode}
//                                                 />
//                                             ))}
//                                         </View>
//                                     ))}
//                                 </View>
//                             )}

//                             <View style={styles.togglesContainer}>
//                                 <View style={styles.toggleRow}>
//                                     <Text style={styles.toggleLabel}>Allow Guest to view Live Gallery?</Text>
//                                     <ToggleSwitch
//                                         checked={step2Data.plan.permissions.canViewGallery}
//                                         isEditMode={isEditMode}
//                                         onChange={(checked) => updatePlanData({
//                                             permissions: {
//                                                 ...step2Data.plan.permissions,
//                                                 canViewGallery: checked
//                                             }
//                                         })}
//                                     />
//                                 </View>
//                                 <View style={styles.toggleRow}>
//                                     <Text style={styles.toggleLabel}>Allow Guest to share Live Gallery pictures?</Text>
//                                     <ToggleSwitch
//                                         checked={step2Data.plan.permissions.canSharePhotos}
//                                         isEditMode={isEditMode}
//                                         onChange={(checked) => updatePlanData({
//                                             permissions: {
//                                                 ...step2Data.plan.permissions,
//                                                 canSharePhotos: checked
//                                             }
//                                         })}
//                                     />
//                                 </View>
//                                 {/* <View style={styles.toggleRow}>
//                                     <Text style={styles.toggleLabel}>Allow Guest to Download All in Live Gallery?</Text>
//                                 <ToggleSwitch
//                                     checked={step2Data.plan.permissions.canDownload}
//                                     isEditMode={isEditMode}
//                                     onChange={(checked) => updatePlanData({
//                                         permissions: {
//                                             ...step2Data.plan.permissions,
//                                             canDownload: checked
//                                         }
//                                     })}
//                                 />
//                                 </View> */}
//                             </View>
//                         </View>
//                     )}

//                     {/* guest photos dropdown */}
//                     <TouchableOpacity
//                         style={[styles.dropdownHeader, guestPhotosOpen ? styles.dropdownHeaderOpen : styles.dropdownHeaderClosed]}
//                         onPress={() => setGuestPhotosOpen((v) => !v)}
//                         activeOpacity={0.7}
//                     >
//                         <View style={styles.dropdownHeaderContent}>
//                             <View>
//                                 <Text style={styles.dropdownTitle}>Guest & Photo Limits</Text>
//                                 <Text style={styles.dropdownSubtitle}>Set capacity and photo limits</Text>
//                             </View>
//                             {guestPhotosOpen ? (
//                                 <ChevronUp width={wp(6)} height={wp(6)} color="#636565" />
//                             ) : (
//                                 <ChevronDown width={wp(6)} height={wp(6)} color="#636565" />
//                             )}
//                         </View>
//                     </TouchableOpacity>
//                     {guestPhotosOpen && (
//                         <View style={styles.guestPhotosContent}>
//                             {/* Guest Limit & Shared Photo Pool */}
//                             <View style={styles.countersRow}>
//                                 <View style={styles.counterContainer}>
//                                     <View style={styles.counterHeader}>
//                                         <Text style={styles.counterLabel}>Guest Limit</Text>
//                                         <Text style={styles.counterPrice}>
//                                             ${formatPrice(step2Data.plan.guestLimitPrice || calculateGuestLimitPrice())}
//                                         </Text>
//                                     </View>
//                                     <View style={styles.counterControls}>
//                                         <TouchableOpacity
//                                             style={[
//                                                 styles.counterButton,
//                                                 (step2Data.plan.guestLimit <= (selectedPlan?.guestLimit || 1)) && styles.counterButtonDisabled
//                                             ]}
//                                             onPress={() => {
//                                                 if (step2Data.plan.guestLimit > (selectedPlan?.guestLimit || 1)) {
//                                                     updatePlanData({ guestLimit: step2Data.plan.guestLimit - 1 });
//                                                 }
//                                             }}
//                                             disabled={step2Data.plan.guestLimit <= (selectedPlan?.guestLimit || 1) || isEditMode}
//                                         >
//                                             <Text style={[styles.counterButtonText, styles.counterButtonTextDecrement]}>-</Text>
//                                         </TouchableOpacity>
//                                         <View style={styles.counterValue}>
//                                             <Text style={styles.counterValueText}>{step2Data.plan.guestLimit}</Text>
//                                         </View>
//                                         <TouchableOpacity
//                                             style={styles.counterButton}
//                                             onPress={() => updatePlanData({ guestLimit: step2Data.plan.guestLimit + 1 })}
//                                             disabled={isEditMode}
//                                         >
//                                             <Text style={[styles.counterButtonText, styles.counterButtonTextIncrement]}>+</Text>
//                                         </TouchableOpacity>
//                                     </View>
//                                 </View>
//                                 <View style={styles.counterContainer}>
//                                     <View style={styles.counterHeader}>
//                                         <Text style={styles.counterLabel}>Shared Photo Pool</Text>
//                                         <Text style={styles.counterPrice}>
//                                             ${formatPrice(step2Data.plan.photoPoolPrice || calculatePhotoPoolPrice())}
//                                         </Text>
//                                     </View>
//                                     <View style={styles.counterControls}>
//                                         <TouchableOpacity
//                                             style={[
//                                                 styles.counterButton,
//                                                 (step2Data.plan.photoPool <= (selectedPlan?.photoPool || 1)) && styles.counterButtonDisabled
//                                             ]}
//                                             onPress={() => {
//                                                 if (step2Data.plan.photoPool > (selectedPlan?.photoPool || 1)) {
//                                                     updatePlanData({ photoPool: Math.max(1, step2Data.plan.photoPool - 1) });
//                                                 }
//                                             }}
//                                             disabled={step2Data.plan.photoPool <= (selectedPlan?.photoPool || 1) || isEditMode}
//                                         >
//                                             <Text style={[styles.counterButtonText, styles.counterButtonTextDecrement]}>-</Text>
//                                         </TouchableOpacity>
//                                         <View style={styles.counterValue}>
//                                             <Text style={styles.counterValueText}>{step2Data.plan.photoPool}</Text>
//                                         </View>
//                                         <TouchableOpacity
//                                             style={styles.counterButton}
//                                             onPress={() => updatePlanData({ photoPool: step2Data.plan.photoPool + 1 })}
//                                             disabled={isEditMode}
//                                         >
//                                             <Text style={[styles.counterButtonText, styles.counterButtonTextIncrement]}>+</Text>
//                                         </TouchableOpacity>
//                                     </View>
//                                 </View>
//                             </View>

//                             <View style={styles.photoLimitToggleContainer}>
//                                 <View style={styles.photoLimitToggleTextContainer}>
//                                     <Text style={styles.toggleLabel}>Limit Photos Per Guest?</Text>
//                                     <Text style={styles.toggleSubLabel}>Set a maximum upload limit per individual guest</Text>
//                                 </View>
//                                 <ToggleSwitch
//                                     checked={showPhotoPerguest}
//                                     // isEditMode={isEditMode}
//                                     onChange={(checked) => {
//                                         if (checked) {
//                                             setShowPhotoPerguest(true)
//                                             updatePlanData({
//                                                 photosPerGuest: 1
//                                             });
//                                         } else {
//                                             setShowPhotoPerguest(!showPhotoPerguest)
//                                             updatePlanData({
//                                                 photosPerGuest: 0
//                                             });
//                                         }
//                                     }}
//                                 />
//                             </View>
//                             {/* Photos Per Guest Input */}
//                             {showPhotoPerguest && (
//                                 <View style={styles.photosPerGuestSection}>
//                                     <Text style={styles.photosPerGuestLabel}>Photos Per Guest</Text>
//                                     {(() => {
//                                         // Calculate the maximum photos per guest allowed
//                                         const maxPhotosPerGuest = step2Data.plan.photoPool;
//                                         return (
//                                             <>
//                                                 <View style={styles.photosPerGuestControls}>
//                                                     <TouchableOpacity
//                                                         style={styles.photosPerGuestButton}
//                                                         onPress={() => updatePlanData({ photosPerGuest: Math.max(1, step2Data.plan.photosPerGuest - 1) })}
//                                                         disabled={step2Data.plan.photosPerGuest <= 1}
//                                                     >
//                                                         <Text style={styles.photosPerGuestButtonText}>-</Text>
//                                                     </TouchableOpacity>
//                                                     <TextInput
//                                                         style={styles.photosPerGuestInput}
//                                                         value={step2Data.plan.photosPerGuest === 0 ? "" : String(step2Data.plan.photosPerGuest)}
//                                                         onChangeText={(val) => {
//                                                             // allow empty string so user can clear field
//                                                             if (val === "") {
//                                                                 updatePlanData({ photosPerGuest: 0 });
//                                                             } else {
//                                                                 updatePlanData({ photosPerGuest: Number(val) });
//                                                             }
//                                                         }}
//                                                         keyboardType="number-pad"
//                                                         maxLength={5}
//                                                     />
//                                                     <TouchableOpacity
//                                                         style={styles.photosPerGuestButton}
//                                                         onPress={() => updatePlanData({ photosPerGuest: Math.min(step2Data.plan.photosPerGuest + 1, maxPhotosPerGuest) })}
//                                                         disabled={step2Data.plan.photosPerGuest >= maxPhotosPerGuest}
//                                                     >
//                                                         <Text style={[styles.photosPerGuestButtonText, styles.photosPerGuestButtonTextIncrement]}>+</Text>
//                                                     </TouchableOpacity>
//                                                 </View>
//                                                 {/* Error message for photosPerGuest > photoPool */}
//                                                 {photosPerGuestError && (
//                                                     <Text style={styles.photosPerGuestError}>
//                                                         {photosPerGuestError}
//                                                     </Text>
//                                                 )}
//                                                 <Text style={styles.photosPerGuestHint}>
//                                                     {`Set a max upload per guest within the total photo pool (Max: ${maxPhotosPerGuest})`}
//                                                 </Text>
//                                             </>
//                                         );
//                                     })()}
//                                 </View>
//                             )}
//                             {/* Storage Duration */}
//                             <View style={styles.storageDurationHeader}>
//                                 <View>
//                                     <Text style={styles.storageDurationTitle}>Storage Duration</Text>
//                                     <Text style={styles.storageDurationSubtitle}>How long photos are stored</Text>
//                                 </View>
//                                 <Text style={styles.storageDurationPrice}>
//                                     {`$${step2Data.plan.storageDaysPrice !== undefined ? formatPrice(step2Data.plan.storageDaysPrice) : selectedStorage?.price}`}
//                                 </Text>
//                             </View>
//                             <DaySelection
//                                 value={step2Data.plan.storageDays}
//                                 onChange={(value) => {
//                                     setSelectedStorage(value);
//                                     updatePlanData({ storageDays: value.days });
//                                     console.log('selected storage =>>>>>>>>>', value)
//                                 }}
//                                 options={selectedPlan?.storageOptions || []}
//                                 isEditMode={isEditMode}
//                             />
//                         </View>
//                     )}

//                 </View>

//                 {/* Plan Details Card */}
//                 <View style={styles.planDetailsContainer}>
//                     <PlanDetailsCardSecondStep
//                         totalPhotoPool={step2Data.plan.photoPool}
//                         guestLimit={step2Data.plan.guestLimit}
//                         maxPerGuest={step2Data.plan.photosPerGuest}
//                         basePlan={`$${formatPrice(selectedPlan?.price || 0)}`}
//                         photoStorageDuration={getCurrentStorageOptionPrice()}
//                         guestLimitPrice={`$${formatPrice(step2Data.plan.guestLimitPrice !== undefined ? step2Data.plan.guestLimitPrice : calculateGuestLimitPrice())}`}
//                         photoPoolPrice={`$${formatPrice(step2Data.plan.photoPoolPrice !== undefined ? step2Data.plan.photoPoolPrice : calculatePhotoPoolPrice())}`}
//                         photosPerGuestPrice={`$${formatPrice(step2Data.plan.photosPerGuest > 0 ? 10 : 0)}`}
//                         totalAmount={`$${formatPrice(step2Data.plan.finalPrice)}`}
//                         isEditMode={isEditMode}
//                         editParam={editParam}
//                     />
//                 </View>

//                 {/* Bottom padding for fixed footer */}
//                 <View style={styles.bottomPadding} />
//             </ScrollView>

//             {/* Fixed Bottom Total Amount */}
//             <View style={styles.fixedBottom}>
//                 <View style={styles.totalAmountContainer}>
//                     <Text style={styles.totalAmountLabel}>Total Amount</Text>
//                     <Text style={styles.totalAmountValue}>${formatPrice(step2Data.plan.finalPrice)}</Text>
//                 </View>
//             </View>
//         </SafeAreaView>
//     );
// };

// const styles = StyleSheet.create({
//     loaderContainer: {
//         flex: 1,
//         justifyContent: 'center',
//         alignItems: 'center',
//         backgroundColor: '#F6FEFF',
//     },
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
//         marginHorizontal: 'auto',
//         shadowColor: '#000',
//         shadowOffset: { width: 0, height: 2 },
//         shadowOpacity: 0.1,
//         shadowRadius: 4,
//         elevation: 3,
//         marginBottom: hp(1),
//     },
//     dropdownHeader: {
//         borderWidth: 1,
//         borderColor: '#E5E5E5',
//         borderRadius: wp(2.5),
//         marginBottom: hp(2),
//     },
//     dropdownHeaderOpen: {
//         backgroundColor: '#F7FCFC',
//     },
//     dropdownHeaderClosed: {
//         backgroundColor: '#FFFFFF',
//     },
//     dropdownHeaderContent: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         justifyContent: 'space-between',
//         paddingHorizontal: wp(4),
//         paddingVertical: hp(1.5),
//     },
//     dropdownTitle: {
//         fontSize: wp(4),
//         fontWeight: 'bold',
//         color: '#3DA9B7',
//         textAlign: 'left',
//     },
//     dropdownSubtitle: {
//         fontSize: wp(3),
//         color: '#000',
//         opacity: 0.5,
//         textAlign: 'left',
//     },
//     plansContent: {
//         width: '100%',
//         paddingBottom: hp(2),
//     },
//     sectionTitle: {
//         fontSize: wp(5),
//         fontWeight: 'bold',
//         color: '#666666',
//         textAlign: 'center',
//         marginTop: hp(1),
//         marginBottom: hp(0.5),
//     },
//     sectionSubtitle: {
//         fontSize: wp(3.5),
//         textAlign: 'center',
//         color: '#666666',
//         marginBottom: hp(2),
//     },
//     errorContainer: {
//         paddingVertical: hp(4),
//         alignItems: 'center',
//         justifyContent: 'center',
//     },
//     errorText: {
//         color: '#EF4444',
//         textAlign: 'center',
//         fontSize: wp(3.5),
//     },
//     plansGrid: {
//         width: '100%',
//         gap: hp(1.5),
//     },
//     planRow: {
//         flexDirection: 'row',
//         gap: wp(3),
//         width: '100%',
//         justifyContent: 'center',
//         marginBottom: hp(1),
//     },
//     togglesContainer: {
//         width: '100%',
//     },
//     toggleRow: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         justifyContent: 'space-between',
//         backgroundColor: '#F7F7F7',
//         borderRadius: wp(3),
//         paddingHorizontal: wp(5),
//         paddingVertical: hp(2.5),
//         marginTop: hp(2),
//     },
//     toggleLabel: {
//         fontSize: wp(3.5),
//         fontWeight: '500',
//         color: '#626666',
//         textAlign: 'left',
//         flex: 1,
//         marginRight: wp(3),
//     },
//     toggleSubLabel: {
//         fontSize: wp(3),
//         fontWeight: '500',
//         color: '#626666',
//         textAlign: 'left',
//         marginTop: hp(0.5),
//     },
//     guestPhotosContent: {
//         paddingBottom: hp(2),
//     },
//     countersRow: {
//         flexDirection: 'row',
//         gap: wp(4),
//         paddingHorizontal: wp(1),
//         marginBottom: hp(1),
//         width: '100%',
//     },
//     counterContainer: {
//         flex: 1,
//         alignItems: 'center',
//         width: '100%',
//     },
//     counterHeader: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         justifyContent: 'space-between',
//         width: '100%',
//         marginBottom: hp(0.5),
//     },
//     counterLabel: {
//         fontSize: wp(3),
//         color: '#666666',
//         fontWeight: '500',
//     },
//     counterPrice: {
//         color: '#3DA9B7',
//         fontSize: wp(2.5),
//         marginRight: wp(1),
//         fontWeight: '500',
//     },
//     counterControls: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         width: '100%',
//     },
//     counterButton: {
//         paddingVertical: hp(1),
//         paddingHorizontal: wp(3),
//         borderRadius: wp(2.5),
//         borderWidth: 1,
//         borderColor: '#E9E9E9',
//         backgroundColor: '#FFFFFF',
//     },
//     counterButtonDisabled: {
//         opacity: 0.5,
//     },
//     counterButtonText: {
//         fontSize: wp(6),
//         color: '#808080',
//     },
//     counterButtonTextDecrement: {
//         color: '#808080',
//     },
//     counterButtonTextIncrement: {
//         color: '#3DA9B7',
//     },
//     counterValue: {
//         flex: 1,
//         paddingVertical: hp(1.5),
//         paddingHorizontal: wp(6),
//         marginHorizontal: wp(2),
//         alignItems: 'center',
//         justifyContent: 'center',
//         borderRadius: wp(2.5),
//         borderWidth: 1,
//         borderColor: '#E9E9E9',
//         minWidth: wp(15),
//     },
//     counterValueText: {
//         fontSize: wp(4),
//         fontWeight: '400',
//         color: '#808080',
//         textAlign: 'center',
//     },
//     photoLimitToggleContainer: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         justifyContent: 'space-between',
//         backgroundColor: '#F7F7F7',
//         paddingHorizontal: wp(5),
//         borderRadius: wp(3),
//         paddingVertical: hp(2.5),
//         marginTop: hp(1),
//     },
//     photoLimitToggleTextContainer: {
//         flexDirection: 'column',
//         width: '60%',
//     },
//     photosPerGuestSection: {
//         width: '100%',
//     },
//     photosPerGuestLabel: {
//         fontSize: wp(3.5),
//         fontWeight: '500',
//         textAlign: 'left',
//         marginTop: hp(1),
//         marginBottom: hp(0.5),
//         color: '#626666',
//     },
//     photosPerGuestControls: {
//         flexDirection: 'row',
//         width: '100%',
//         marginBottom: hp(1.5),
//         alignItems: 'center',
//     },
//     photosPerGuestButton: {
//         paddingVertical: hp(0.5),
//         paddingHorizontal: wp(2),
//         borderRadius: wp(1.5),
//         borderWidth: 1,
//         borderColor: '#B2B2B2',
//         alignItems: 'center',
//         justifyContent: 'center',
//     },
//     photosPerGuestButtonText: {
//         fontSize: wp(6),
//         color: '#B2B2B2',
//     },
//     photosPerGuestButtonTextIncrement: {
//         color: '#3DA9B7',
//     },
//     photosPerGuestInput: {
//         flex: 1,
//         marginHorizontal: wp(2),
//         paddingVertical: hp(0.75),
//         textAlign: 'center',
//         fontSize: wp(4.5),
//         color: '#B2B2B2',
//         backgroundColor: '#FFFFFF',
//         borderWidth: 1,
//         borderRadius: wp(1.5),
//         borderColor: '#E6E6E6',
//         minWidth: 0,
//     },
//     photosPerGuestError: {
//         color: '#EF4444',
//         textAlign: 'center',
//         fontSize: wp(3),
//         marginBottom: hp(1),
//     },
//     photosPerGuestHint: {
//         color: '#A3A3A3',
//         textAlign: 'center',
//         fontSize: wp(2.5),
//         alignItems: 'center',
//         justifyContent: 'center',
//         width: '100%',
//     },
//     storageDurationHeader: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         justifyContent: 'space-between',
//         marginTop: hp(3),
//         marginBottom: hp(0.5),
//     },
//     storageDurationTitle: {
//         fontSize: wp(3.5),
//         fontWeight: '500',
//         textAlign: 'left',
//         color: '#626666',
//     },
//     storageDurationSubtitle: {
//         fontSize: wp(3),
//         fontWeight: '400',
//         color: '#ACACAC',
//     },
//     storageDurationPrice: {
//         color: '#3DA9B7',
//         fontSize: wp(3),
//         fontWeight: '500',
//     },
//     planDetailsContainer: {
//         width: '100%',
//         marginTop: 0,
//     },
//     bottomPadding: {
//         height: hp(10),
//     },
//     fixedBottom: {
//         position: 'absolute',
//         left: 0,
//         right: 0,
//         bottom: 0,
//         backgroundColor: '#FFFFFF',
//         shadowColor: '#000',
//         shadowOffset: { width: 0, height: -2 },
//         shadowOpacity: 0.04,
//         shadowRadius: 16,
//         elevation: 8,
//         paddingTop: hp(1),
//         paddingBottom: hp(1),
//         paddingHorizontal: wp(3),
//     },
//     totalAmountContainer: {
//         flexDirection: 'row',
//         justifyContent: 'space-between',
//         alignItems: 'center',
//         backgroundColor: '#F5F5F5',
//         borderRadius: wp(2),
//         paddingHorizontal: wp(4),
//         paddingVertical: hp(2),
//         width: '100%',
//         maxWidth: wp(95),
//         alignSelf: 'center',
//     },
//     totalAmountLabel: {
//         fontSize: wp(3.8),
//         fontWeight: '600',
//         color: '#A3A3A3',
//     },
//     totalAmountValue: {
//         fontSize: wp(4.5),
//         fontWeight: 'bold',
//         color: '#A3A3A3',
//     },
// });

// export default CreateEventSecondStep;
