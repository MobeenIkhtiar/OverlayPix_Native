import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, StyleSheet } from 'react-native';
import { useRoute } from '@react-navigation/native';
import Header from '../../components/Header';
import Stepper from '../../components/Stepper';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import Loader from '../../components/Loader';
import { formatPrice } from '../../utils/HelperFunctions';
import { planService } from '../../services/planService';
import { useCreateEvent } from '../../hooks/useCreateEvent';
import { Plan } from '../../types/plan';
import PlanCard from '../../components/PlanCard';
import DaySelection from '../../components/DaySelection';
import PlanDetailsCardSecondStep from '../../components/PlanDetailsCardSecondStep';
import ToggleSwitch from '../../components/ToggleSwitch';
import { wp, hp } from '../../contants/StyleGuide';
import { SafeAreaView } from 'react-native-safe-area-context';

const CreateEventSecondStep: React.FC = () => {
    const route = useRoute();
    const [plansOpen, setPlansOpen] = useState<boolean>(true);
    const [guestPhotosOpen, setGuestPhotosOpen] = useState<boolean>(false);
    const [isEditMode, setIsEditMode] = useState<boolean>(false);
    const [plans, setPlans] = useState<Plan[]>([]);
    const [addOnPlans, setAddOnPlans] = useState<Plan[]>([]);
    const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
    const [selectedStorage, setSelectedStorage] = useState<any>();
    const [showPhotoPerguest, setShowPhotoPerguest] = useState<boolean>(false);
    const { step2Data, updateStep2Data } = useCreateEvent();

    // Get edit parameter from route params
    const editParam = (route.params as any)?.eventId;

    // New: Error state for photosPerGuest > photoPool
    const [photosPerGuestError, setPhotosPerGuestError] = useState<string | null>(null);

    // Helper to round off photosPerGuest
    const getRoundedPhotosPerGuest = (photoPool: number, guestLimit: number) => {
        if (!guestLimit) return 0;
        return Math.round(photoPool / guestLimit);
    };

    // Fetch plans from API
    useEffect(() => {
        const fetchPlans = async () => {
            try {
                setLoading(true);
                setError(null);
                const fetchedPlans = await planService.getPlans();

                const filteredBasePlans = fetchedPlans.filter(p => p.id !== 'add_guest_5' && p.id !== 'add_photos_10');
                const filteredAddOnPlans = fetchedPlans.filter(p => p.id === 'add_guest_5' || p.id === 'add_photos_10');

                // Sort plans by price ascending before setting state
                const sortedPlans = [...filteredBasePlans].sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
                setPlans(sortedPlans);
                setAddOnPlans(filteredAddOnPlans);

                if (!step2Data.plan.planId && sortedPlans.length > 0) {
                    // Default to Starter Event, then Free, then cheapest
                    const defaultPlan = sortedPlans.find(plan => plan.id === 'starter_event' || plan.name.toLowerCase().includes('starter'))
                        || sortedPlans.find(plan => plan.name.toLowerCase().includes('free'))
                        || sortedPlans[0];
                    setSelectedPlan(defaultPlan);

                    // Set selected storage to the first storage option of the default plan
                    if (defaultPlan.storageOptions && defaultPlan.storageOptions.length > 0) {
                        setSelectedStorage(defaultPlan.storageOptions[0]);
                    }

                    updatePlanData({
                        planId: defaultPlan.id,
                        basePlan: defaultPlan.price,
                        guestLimit: defaultPlan.guestLimit,
                        photoPool: defaultPlan.photoPool,
                        photosPerGuest: 0,
                        storageDays: defaultPlan.defaultStorageDays,
                        permissions: {
                            canViewGallery: true,
                            canSharePhotos: false,
                            canDownload: false
                        },
                        currencySymbol: defaultPlan.formattedPrice ? defaultPlan.formattedPrice.replace(/[\d.,\s]+/g, '') : '$'
                    }, defaultPlan); // Pass defaultPlan so prices are calculated correctly
                } else if (step2Data.plan.planId) {
                    // If we have a plan ID, find and set the selected plan
                    const currentPlan = sortedPlans.find(plan => plan.id === step2Data.plan.planId);
                    if (currentPlan) {
                        setSelectedPlan(currentPlan);

                        // Set selected storage to the first storage option of the current plan
                        if (currentPlan.storageOptions && currentPlan.storageOptions.length > 0) {
                            setSelectedStorage(currentPlan.storageOptions[0]);
                        }

                        if (!step2Data.plan.planName) {
                            updatePlanData({
                                planName: currentPlan.name,
                                currencySymbol: currentPlan.formattedPrice ? currentPlan.formattedPrice.replace(/[\d.,\s]+/g, '') : '$'
                            }, currentPlan);
                        }
                    }
                }
            } catch (err) {
                setError('Failed to load plans. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchPlans();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Check if we're in edit mode by checking route params
    useEffect(() => {
        if (editParam) {
            setIsEditMode(true);
        } else {
            setIsEditMode(false);
        }
    }, [editParam]);

    // FIXED: Calculate prices with proper precision
    const calculatePrices = React.useCallback(() => {
        if (!selectedPlan) return;

        const guestLimitPrice = calculateGuestLimitPrice();
        const photoPoolPrice = calculatePhotoPoolPrice();
        const storageDurationPrice = calculateStorageDurationPrice();
        const addOnsPrice = calculateAddOnsPrice();

        // Always include base plan price with proper decimal handling
        const totalPrice = (selectedPlan.price || 0) + guestLimitPrice + photoPoolPrice + storageDurationPrice + addOnsPrice;

        return {
            guestLimitPrice: Number(guestLimitPrice.toFixed(2)),
            photoPoolPrice: Number(photoPoolPrice.toFixed(2)),
            storageDaysPrice: Number(storageDurationPrice.toFixed(2)),
            addOnsPrice: Number(addOnsPrice.toFixed(2)),
            finalPrice: Number(totalPrice.toFixed(2))
        };
    }, [selectedPlan, step2Data.plan.guestLimit, step2Data.plan.photoPool, step2Data.plan.storageDays, selectedAddonIds]); // Added selectedAddonIds dependency

    // Helper to get total capacity from add-ons
    const getAddonCapacity = (addonIds: string[]) => {
        let guestLimit = 0;
        let photoPool = 0;
        addonIds.forEach(id => {
            const addon = addOnPlans.find(p => p.id === id);
            if (addon) {
                if (addon.id === 'add_guest_5') guestLimit += 5;
                else if (addon.id === 'add_photos_10') photoPool += 10;
                // Fallback
                else {
                    guestLimit += (addon.guestLimit || 0);
                    photoPool += (addon.photoPool || 0);
                }
            }
        });
        return { guestLimit, photoPool };
    };

    // FIXED: Calculate guest limit price with proper precision
    const calculateGuestLimitPrice = (): number => {
        if (!selectedPlan) return 0;
        const base = selectedPlan.guestLimit || 1;
        const pricePerGuest = selectedPlan.guestLimitIncreasePricePerGuest || 0;

        const { guestLimit: addonGuests } = getAddonCapacity(selectedAddonIds);

        // Subtract add-on guests from total before checking against base
        const extra = Math.max(0, step2Data.plan.guestLimit - addonGuests - base);

        // Use proper decimal arithmetic to avoid floating point issues
        const calculatedPrice = extra * pricePerGuest;
        return Number(calculatedPrice.toFixed(2));
    };

    // FIXED: Calculate photo pool price with proper precision
    const calculatePhotoPoolPrice = (): number => {
        if (!selectedPlan) return 0;
        const base = selectedPlan.photoPool || 1;
        const pricePerPhoto = selectedPlan.photoPoolLimitIncreasePricePerPhoto || 0;

        const { photoPool: addonPhotos } = getAddonCapacity(selectedAddonIds);

        const extra = Math.max(0, step2Data.plan.photoPool - addonPhotos - base);

        // Use proper decimal arithmetic to avoid floating point issues
        const calculatedPrice = extra * pricePerPhoto;
        return Number(calculatedPrice.toFixed(2));
    };

    // Calculate storage duration price based on selected option
    const calculateStorageDurationPrice = (): number => {
        if (!selectedPlan?.storageOptions) return 0;
        const currentOption = selectedPlan.storageOptions.find(option => option.days === step2Data.plan.storageDays);
        if (!currentOption) return 0;
        return currentOption.price || 0;
    };

    // New: Calculate total price of selected add-ons
    const calculateAddOnsPrice = (): number => {
        let total = 0;
        selectedAddonIds.forEach(id => {
            const addon = addOnPlans.find(p => p.id === id);
            if (addon) {
                total += (addon.price || 0);
            }
        });
        return total;
    };

    // Helper functions that accept plan data and plan as parameters
    const calculateGuestLimitPriceWithData = (planData: typeof step2Data.plan, plan: Plan, addonIds: string[]): number => {
        if (!plan) return 0;
        const base = plan.guestLimit || 1;
        const pricePerGuest = plan.guestLimitIncreasePricePerGuest || 0;

        const { guestLimit: addonGuests } = getAddonCapacity(addonIds);

        const extra = Math.max(0, planData.guestLimit - addonGuests - base);
        const calculatedPrice = extra * pricePerGuest;
        return Number(calculatedPrice.toFixed(2));
    };

    const calculatePhotoPoolPriceWithData = (planData: typeof step2Data.plan, plan: Plan, addonIds: string[]): number => {
        if (!plan) return 0;
        const base = plan.photoPool || 1;
        const pricePerPhoto = plan.photoPoolLimitIncreasePricePerPhoto || 0;

        const { photoPool: addonPhotos } = getAddonCapacity(addonIds);

        const extra = Math.max(0, planData.photoPool - addonPhotos - base);
        const calculatedPrice = extra * pricePerPhoto;
        return Number(calculatedPrice.toFixed(2));
    };

    const calculateStorageDurationPriceWithData = (planData: typeof step2Data.plan, plan: Plan): number => {
        if (!plan?.storageOptions) return 0;
        const currentOption = plan.storageOptions.find(option => option.days === planData.storageDays);
        if (!currentOption) return 0;
        return currentOption.price || 0;
    };

    // Update context when local state changes
    // planOverride is used when selectedPlan state hasn't updated yet (e.g., in handlePlanSelect)
    const updatePlanData = (updates: Partial<typeof step2Data.plan>, planOverride?: Plan) => {
        const activePlan = planOverride || selectedPlan;

        const newPlanData = {
            ...step2Data.plan,
            ...updates,
            planName: activePlan?.name || step2Data.plan.planName
        };

        // Calculate prices using the NEW merged data and the active plan
        if (activePlan) {
            const guestLimitPrice = calculateGuestLimitPriceWithData(newPlanData, activePlan, selectedAddonIds);
            const photoPoolPrice = calculatePhotoPoolPriceWithData(newPlanData, activePlan, selectedAddonIds);
            const storageDurationPrice = calculateStorageDurationPriceWithData(newPlanData, activePlan);

            // Calculate add-on price (using current state of selectedAddonIds)
            let addOnsPrice = 0;
            selectedAddonIds.forEach(id => {
                const addon = addOnPlans.find(p => p.id === id);
                if (addon) addOnsPrice += (addon.price || 0);
            });

            const totalPrice = (activePlan.price || 0) + guestLimitPrice + photoPoolPrice + storageDurationPrice + addOnsPrice;

            newPlanData.finalPrice = Number(totalPrice.toFixed(2));
            newPlanData.guestLimitPrice = Number(guestLimitPrice.toFixed(2));
            newPlanData.photoPoolPrice = Number(photoPoolPrice.toFixed(2));
            newPlanData.storageDaysPrice = Number(storageDurationPrice.toFixed(2));
        }

        updateStep2Data({
            plan: newPlanData
        });
    };

    // Handle plan selection
    const handlePlanSelect = (plan: Plan) => {
        setSelectedPlan(plan);
        // Reset add-ons when changing base plan
        setSelectedAddonIds([]);
        setShowPhotoPerguest(false);

        // Use updatePlanData with plan override to ensure prices are calculated correctly
        updatePlanData({
            planId: plan.id,
            basePlan: plan.price,
            guestLimit: plan.guestLimit,
            photoPool: plan.photoPool,
            photosPerGuest: 0,
            storageDays: plan.defaultStorageDays,
            permissions: {
                canViewGallery: true,
                canSharePhotos: false,
                canDownload: false
            },
            currencySymbol: plan.formattedPrice ? plan.formattedPrice.replace(/[\d.,\s]+/g, '') : '$'
        }, plan); // Pass plan as override since selectedPlan state hasn't updated yet

        // Set selected storage to the first storage option of the new plan
        if (plan.storageOptions && plan.storageOptions.length > 0) {
            setSelectedStorage(plan.storageOptions[0]);
        }
    };

    const handleAddonToggle = (addon: Plan) => {
        let newSelectedIds = [...selectedAddonIds];
        const isSelected = newSelectedIds.includes(addon.id);

        let guestLimitChange = 0;
        let photoPoolChange = 0;

        // Determine the impact of this add-on
        if (addon.id === 'add_guest_5') {
            guestLimitChange = 5;
        } else if (addon.id === 'add_photos_10') {
            photoPoolChange = 10;
        } else {
            guestLimitChange = addon.guestLimit || 0;
            photoPoolChange = addon.photoPool || 0;
        }

        if (isSelected) {
            // Remove
            newSelectedIds = newSelectedIds.filter(id => id !== addon.id);
            guestLimitChange = -guestLimitChange;
            photoPoolChange = -photoPoolChange;
        } else {
            // Add
            newSelectedIds.push(addon.id);
        }

        setSelectedAddonIds(newSelectedIds);

        // Update limits
        const newGuestLimit = step2Data.plan.guestLimit + guestLimitChange;
        const newPhotoPool = step2Data.plan.photoPool + photoPoolChange;

        let totalAddonsPrice = 0;
        newSelectedIds.forEach(id => {
            const a = addOnPlans.find(p => p.id === id);
            if (a) totalAddonsPrice += (a.price || 0);
        });

        if (selectedPlan) {
            const guestLimitPrice = calculateGuestLimitPriceWithData({ ...step2Data.plan, guestLimit: newGuestLimit }, selectedPlan, newSelectedIds);
            const photoPoolPrice = calculatePhotoPoolPriceWithData({ ...step2Data.plan, photoPool: newPhotoPool }, selectedPlan, newSelectedIds);
            const storageDurationPrice = calculateStorageDurationPriceWithData(step2Data.plan, selectedPlan);

            const totalPrice = (selectedPlan.price || 0) + guestLimitPrice + photoPoolPrice + storageDurationPrice + totalAddonsPrice;

            updateStep2Data({
                plan: {
                    ...step2Data.plan,
                    guestLimit: newGuestLimit,
                    photoPool: newPhotoPool,
                    finalPrice: Number(totalPrice.toFixed(2)),
                    guestLimitPrice: Number(guestLimitPrice.toFixed(2)),
                    photoPoolPrice: Number(photoPoolPrice.toFixed(2)),
                }
            });
        }
    };

    // FIXED: Keep photosPerGuest in sync with guestLimit and photoPool changes
    useEffect(() => {
        // Only adjust if the limit is enabled (photosPerGuest > 0)
        if (step2Data.plan.photosPerGuest > 0) {
            const maxPhotosPerGuest = Math.floor(step2Data.plan.photoPool / (step2Data.plan.guestLimit || 1));
            if (step2Data.plan.photosPerGuest > maxPhotosPerGuest) {
                updatePlanData({ photosPerGuest: maxPhotosPerGuest });
            }
            // If maxPhotosPerGuest drops below 1, disable the toggle
            if (maxPhotosPerGuest < 1) {
                updatePlanData({ photosPerGuest: 0 });
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [step2Data.plan.guestLimit, step2Data.plan.photoPool]);

    // FIXED: Validate photosPerGuest is not greater than photoPool
    useEffect(() => {
        if (
            typeof step2Data.plan.photosPerGuest === 'number' &&
            typeof step2Data.plan.photoPool === 'number' &&
            step2Data.plan.photosPerGuest > step2Data.plan.photoPool
        ) {
            setPhotosPerGuestError('Photos per guest cannot be greater than the total photo pool.');
        } else {
            setPhotosPerGuestError(null);
        }
    }, [step2Data.plan.photosPerGuest, step2Data.plan.photoPool]);

    // Helper to chunk plans into rows of 2
    const chunkPlans = (plansArr: Plan[], size: number): Plan[][] => {
        const result: Plan[][] = [];
        for (let i = 0; i < plansArr.length; i += size) {
            result.push(plansArr.slice(i, i + size));
        }
        return result;
    };

    // Helper to get current storage option price
    const getCurrentStorageOptionPrice = (): string => {
        if (!selectedPlan?.storageOptions) {
            return '$0';
        }

        const currentOption = selectedPlan.storageOptions.find(option => option.days === step2Data.plan.storageDays);
        if (!currentOption) {
            return '$0';
        }

        // Price is now a number, so we can directly use it
        // We try to extract the currency symbol from the selected plan if possible, else default to $
        const currencySymbol = selectedPlan?.formattedPrice ? selectedPlan.formattedPrice.replace(/[\d.,\s]+/g, '') : '$';
        return currentOption.price === 0 ? `${currencySymbol}0` : `${currencySymbol}${currentOption.price}`;
    };

    // Show loader while loading plans
    if (loading) {
        return (
            <View style={styles.loaderContainer}>
                <Loader />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <Header
                    title={isEditMode ? "Edit Event" : "Create Event"}
                    subtitle=""
                    logoHover={true}
                />
                {/* stepper */}
                <Stepper steps={4} activeStep={2} />
                <View style={styles.mainCard}>
                    {/* plans dropdown */}
                    <TouchableOpacity
                        style={[styles.dropdownHeader, plansOpen ? styles.dropdownHeaderOpen : styles.dropdownHeaderClosed]}
                        onPress={() => setPlansOpen((v) => !v)}
                        activeOpacity={0.7}
                    >
                        <View style={styles.dropdownHeaderContent}>
                            <View>
                                <Text style={styles.dropdownTitle}>Plans</Text>
                                <Text style={styles.dropdownSubtitle}>Choose a plan for your event</Text>
                            </View>
                            {plansOpen ? (
                                <ChevronUp width={wp(6)} height={wp(6)} color="#636565" />
                            ) : (
                                <ChevronDown width={wp(6)} height={wp(6)} color="#636565" />
                            )}
                        </View>
                    </TouchableOpacity>
                    {plansOpen && (
                        <View style={styles.plansContent}>
                            <Text style={styles.sectionTitle}>Plans</Text>
                            <Text style={styles.sectionSubtitle}>Choose a plan for your event</Text>

                            {error && (
                                <View style={styles.errorContainer}>
                                    <Text style={styles.errorText}>{error}</Text>
                                </View>
                            )}

                            {!error && plans?.length > 0 && (
                                <View style={styles.plansGrid}>
                                    {chunkPlans(plans, 2).map((planRow, rowIdx) => (
                                        <View key={rowIdx} style={styles.planRow}>
                                            {planRow.map((plan, index) => (
                                                <PlanCard
                                                    key={`${plan.name}-${index}`}
                                                    plan={plan}
                                                    selected={step2Data.plan.planId === plan.id}
                                                    onClick={() => handlePlanSelect(plan)}
                                                    isEditMode={isEditMode}
                                                />
                                            ))}
                                        </View>
                                    ))}
                                </View>
                            )}

                            <View style={styles.togglesContainer}>
                                <View style={styles.toggleRow}>
                                    <Text style={styles.toggleLabel}>Allow Guest to view Live Gallery?</Text>
                                    <ToggleSwitch
                                        checked={step2Data.plan.permissions.canViewGallery}
                                        isEditMode={isEditMode}
                                        onChange={(checked) => updatePlanData({
                                            permissions: {
                                                ...step2Data.plan.permissions,
                                                canViewGallery: checked
                                            }
                                        })}
                                    />
                                </View>
                                <View style={styles.toggleRow}>
                                    <Text style={styles.toggleLabel}>Allow Guest to Download Live Gallery pictures?</Text>
                                    <ToggleSwitch
                                        checked={step2Data.plan.permissions.canSharePhotos}
                                        isEditMode={false}
                                        onChange={(checked) => updatePlanData({
                                            permissions: {
                                                ...step2Data.plan.permissions,
                                                canSharePhotos: checked
                                            }
                                        })}
                                    />
                                </View>
                            </View>
                        </View>
                    )}

                    {/* Add-ons Section */}
                    {/* {addOnPlans.length > 0 && (
                        <>
                            <View style={styles.dropdownHeader}>
                                <View style={styles.dropdownHeaderContent}>
                                    <View>
                                        <Text style={styles.dropdownTitle}>Add-ons</Text>
                                        <Text style={styles.dropdownSubtitle}>Enhance your plan with extras</Text>
                                    </View>
                                </View>
                            </View>
                            <View style={styles.plansContent}>
                                <View style={styles.plansGrid}>
                                    {chunkPlans(addOnPlans, 2).map((planRow, rowIdx) => (
                                        <View key={rowIdx} style={styles.planRow}>
                                            {planRow.map((addon, index) => {
                                                const isSelected = selectedAddonIds.includes(addon.id);
                                                return (
                                                    <TouchableOpacity
                                                        key={`${addon.id}-${index}`}
                                                        style={[
                                                            styles.addonCard,
                                                            isSelected && styles.addonCardSelected
                                                        ]}
                                                        onPress={() => handleAddonToggle(addon)}
                                                        activeOpacity={0.7}
                                                    >
                                                        <Text style={styles.addonTitle}>{addon.name || (addon.id === 'add_guest_5' ? 'Add 5 Guests' : 'Add 10 Photos')}</Text>
                                                        <Text style={styles.addonPrice}>+ {addon.formattedPrice || `$${formatPrice(addon.price || 0)}`}</Text>
                                                        {isSelected && (
                                                            <View style={styles.selectedBadge}>
                                                                <Text style={styles.selectedBadgeText}>Added</Text>
                                                            </View>
                                                        )}
                                                    </TouchableOpacity>
                                                );
                                            })}
                                        </View>
                                    ))}
                                </View>
                            </View>
                        </>
                    )} */}

                    {/* guest photos dropdown */}
                    {/* <TouchableOpacity
                        style={[styles.dropdownHeader, guestPhotosOpen ? styles.dropdownHeaderOpen : styles.dropdownHeaderClosed]}
                        onPress={() => setGuestPhotosOpen((v) => !v)}
                        activeOpacity={0.7}
                    >
                        <View style={styles.dropdownHeaderContent}>
                            <View>
                                <Text style={styles.dropdownTitle}>Guest & Photo Limits</Text>
                                <Text style={styles.dropdownSubtitle}>Set capacity and photo limits</Text>
                            </View>
                            {guestPhotosOpen ? (
                                <ChevronUp width={wp(6)} height={wp(6)} color="#636565" />
                            ) : (
                                <ChevronDown width={wp(6)} height={wp(6)} color="#636565" />
                            )}
                        </View>
                    </TouchableOpacity> */}

                    {/* {guestPhotosOpen && (
                        <View style={styles.guestPhotosContent}> */}
                    {/* Guest Limit & Shared Photo Pool */}
                    {/* 
                    <View style={styles.countersRow}>
                        <View style={styles.counterContainer}>


                            <View style={styles.counterHeader}>
                                <Text style={styles.counterLabel}>Guest Limit</Text>
                                <Text style={styles.counterPrice}>
                                    ${formatPrice(step2Data.plan.guestLimitPrice || 0)}
                                </Text>
                            </View>
                            <View style={styles.counterControls}>
                                <TouchableOpacity
                                    style={[
                                        styles.counterButton,
                                        (step2Data.plan.guestLimit <= (selectedPlan?.guestLimit || 1)) && styles.counterButtonDisabled
                                    ]}
                                    onPress={() => {
                                        if (step2Data.plan.guestLimit > (selectedPlan?.guestLimit || 1)) {
                                            updatePlanData({ guestLimit: step2Data.plan.guestLimit - 1 });
                                        }
                                    }}
                                    disabled={step2Data.plan.guestLimit <= (selectedPlan?.guestLimit || 1) || isEditMode}
                                >
                                    <Text style={[styles.counterButtonText, styles.counterButtonTextDecrement]}>-</Text>
                                </TouchableOpacity>
                                <View style={styles.counterValue}>
                                    <Text style={styles.counterValueText} numberOfLines={1}>{step2Data.plan.guestLimit}</Text>
                                </View>
                                <TouchableOpacity
                                    style={styles.counterButton}
                                    onPress={() => updatePlanData({ guestLimit: step2Data.plan.guestLimit + 1 })}
                                    disabled={isEditMode}
                                >
                                    <Text style={[styles.counterButtonText, styles.counterButtonTextIncrement]}>+</Text>
                                </TouchableOpacity>
                            </View>

                        </View>
                        <View style={styles.counterContainer}>

                            <View style={styles.counterHeader}>
                                <Text style={styles.counterLabel}>Shared Photo Pool</Text>
                                <Text style={styles.counterPrice}>
                                    ${formatPrice(step2Data.plan.photoPoolPrice || 0)}
                                </Text>
                            </View>
                            <View style={styles.counterControls}>
                                <TouchableOpacity
                                    style={[
                                        styles.counterButton,
                                        (step2Data.plan.photoPool <= (selectedPlan?.photoPool || 1)) && styles.counterButtonDisabled
                                    ]}
                                    onPress={() => {
                                        if (step2Data.plan.photoPool > (selectedPlan?.photoPool || 1)) {
                                            updatePlanData({ photoPool: Math.max(1, step2Data.plan.photoPool - 1) });
                                        }
                                    }}
                                    disabled={step2Data.plan.photoPool <= (selectedPlan?.photoPool || 1) || isEditMode}
                                >
                                    <Text style={[styles.counterButtonText, styles.counterButtonTextDecrement]}>-</Text>
                                </TouchableOpacity>
                                <View style={styles.counterValue}>
                                    <Text style={styles.counterValueText} numberOfLines={1}>{step2Data.plan.photoPool}</Text>
                                </View>
                                <TouchableOpacity
                                    style={styles.counterButton}
                                    onPress={() => updatePlanData({ photoPool: step2Data.plan.photoPool + 1 })}
                                    disabled={isEditMode}
                                >
                                    <Text style={[styles.counterButtonText, styles.counterButtonTextIncrement]}>+</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View> */}

                    <View style={styles.photoLimitToggleContainer}>
                        <View style={styles.photoLimitToggleTextContainer}>
                            <Text style={styles.toggleLabel}>Limit Photos Per Guest?</Text>
                            <Text style={styles.toggleSubLabel}>Set a maximum upload limit per individual guest</Text>
                        </View>
                        <ToggleSwitch
                            checked={showPhotoPerguest}
                            onChange={(checked) => {
                                if (checked) {
                                    setShowPhotoPerguest(true)
                                    updatePlanData({
                                        photosPerGuest: 1
                                    });
                                } else {
                                    setShowPhotoPerguest(!showPhotoPerguest)
                                    updatePlanData({
                                        photosPerGuest: 0
                                    });
                                }
                            }}
                        />
                    </View>
                    {/* Photos Per Guest Input */}
                    {showPhotoPerguest && (
                        <View style={styles.photosPerGuestSection}>
                            <Text style={styles.photosPerGuestLabel}>Photos Per Guest</Text>
                            {(() => {
                                // Calculate the maximum photos per guest allowed
                                const maxPhotosPerGuest = step2Data.plan.photoPool;
                                return (
                                    <>
                                        <View style={styles.photosPerGuestControls}>
                                            <TouchableOpacity
                                                style={styles.photosPerGuestButton}
                                                onPress={() => updatePlanData({ photosPerGuest: Math.max(1, step2Data.plan.photosPerGuest - 1) })}
                                                disabled={step2Data.plan.photosPerGuest <= 1}
                                            >
                                                <Text style={styles.photosPerGuestButtonText}>-</Text>
                                            </TouchableOpacity>
                                            <TextInput
                                                style={styles.photosPerGuestInput}
                                                value={step2Data.plan.photosPerGuest === 0 ? "" : String(step2Data.plan.photosPerGuest)}
                                                onChangeText={(val) => {
                                                    // allow empty string so user can clear field
                                                    if (val === "") {
                                                        updatePlanData({ photosPerGuest: 0 });
                                                    } else {
                                                        updatePlanData({ photosPerGuest: Number(val) });
                                                    }
                                                }}
                                                keyboardType="number-pad"
                                                maxLength={5}
                                            />
                                            <TouchableOpacity
                                                style={styles.photosPerGuestButton}
                                                onPress={() => {
                                                    console.log('maxPhotosPerGuest', maxPhotosPerGuest);
                                                    console.log('step2Data.plan.photosPerGuest', step2Data.plan.photosPerGuest);
                                                    updatePlanData({ photosPerGuest: Math.min(step2Data.plan.photosPerGuest + 1, maxPhotosPerGuest) })
                                                }}
                                                disabled={step2Data.plan.photosPerGuest >= maxPhotosPerGuest}
                                            >
                                                <Text style={[styles.photosPerGuestButtonText, styles.photosPerGuestButtonTextIncrement]}>+</Text>
                                            </TouchableOpacity>
                                        </View>
                                        {photosPerGuestError && (
                                            <Text style={styles.photosPerGuestError}>
                                                {photosPerGuestError}
                                            </Text>
                                        )}
                                        <Text style={styles.photosPerGuestHint}>
                                            {`Set a max upload per guest within the total photo pool (Max: ${maxPhotosPerGuest})`}
                                        </Text>
                                    </>
                                );
                            })()}
                        </View>
                    )}
                    {/* Storage Duration */}
                    {/* <View style={styles.storageDurationHeader}>
                                <View>
                                    <Text style={styles.storageDurationTitle}>Storage Duration</Text>
                                    <Text style={styles.storageDurationSubtitle}>How long photos are stored</Text>
                                </View>
                                <Text style={styles.storageDurationPrice}>
                                    {(() => {
                                        const currencySymbol = selectedPlan?.formattedPrice ? selectedPlan.formattedPrice.replace(/[\d.,\s]+/g, '') : '$';
                                        return step2Data.plan.storageDaysPrice !== undefined
                                            ? `${currencySymbol}${formatPrice(step2Data.plan.storageDaysPrice)}`
                                            : (selectedStorage?.price !== undefined ? `${currencySymbol}${selectedStorage.price}` : `${currencySymbol}0`);
                                    })()}
                                </Text>
                            </View>
                            <DaySelection
                                value={step2Data.plan.storageDays}
                                onChange={(value) => {
                                    setSelectedStorage(value);
                                    updatePlanData({ storageDays: value.days });
                                }}
                                options={selectedPlan?.storageOptions || []}
                                isEditMode={isEditMode}
                            />
                        </View>
                    )} */}

                </View>

                <View style={styles.planDetailsContainer}>
                    <PlanDetailsCardSecondStep
                        totalPhotoPool={step2Data.plan.photoPool}
                        guestLimit={step2Data.plan.guestLimit}
                        maxPerGuest={step2Data.plan.photosPerGuest}
                        basePlan={selectedPlan?.formattedPrice || `$${formatPrice(selectedPlan?.price || 0)}`}
                        planName={selectedPlan?.name || ''}
                        photoStorageDuration={getCurrentStorageOptionPrice()}
                        guestLimitPrice={(() => {
                            const currencySymbol = selectedPlan?.formattedPrice ? selectedPlan.formattedPrice.replace(/[\d.,\s]+/g, '') : '$';
                            return `${currencySymbol}${formatPrice(step2Data.plan.guestLimitPrice || 0)}`;
                        })()}
                        photoPoolPrice={(() => {
                            const currencySymbol = selectedPlan?.formattedPrice ? selectedPlan.formattedPrice.replace(/[\d.,\s]+/g, '') : '$';
                            return `${currencySymbol}${formatPrice(step2Data.plan.photoPoolPrice || 0)}`;
                        })()}
                        photosPerGuestPrice={(() => {
                            const currencySymbol = selectedPlan?.formattedPrice ? selectedPlan.formattedPrice.replace(/[\d.,\s]+/g, '') : '$';
                            return `${currencySymbol}${formatPrice(step2Data.plan.photosPerGuest > 0 ? 10 : 0)}`;
                        })()}
                        totalAmount={(() => {
                            const currencySymbol = selectedPlan?.formattedPrice ? selectedPlan.formattedPrice.replace(/[\d.,\s]+/g, '') : '$';
                            return `${currencySymbol}${formatPrice(step2Data.plan.finalPrice)}`;
                        })()}
                        isEditMode={isEditMode}
                        editParam={editParam}
                    />
                </View>

                {/* Bottom padding for fixed footer */}
                <View style={styles.bottomPadding} />
            </ScrollView>

            {/* Fixed Bottom Total Amount */}
            <View style={styles.fixedBottom}>
                <View style={styles.totalAmountContainer}>
                    <Text style={styles.totalAmountLabel}>Total Amount</Text>
                    <Text style={styles.totalAmountValue}>
                        {(() => {
                            const currencySymbol = selectedPlan?.formattedPrice ? selectedPlan.formattedPrice.replace(/[\d.,\s]+/g, '') : '$';
                            return `${currencySymbol}${formatPrice(step2Data.plan.finalPrice)}`;
                        })()}
                    </Text>
                </View>
            </View>
        </SafeAreaView>
    );
};

// ... (keep your existing styles the same)

const styles = StyleSheet.create({
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F6FEFF',
    },
    container: {
        flex: 1,
        backgroundColor: '#F6FEFF',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: wp(3),
        paddingBottom: hp(12),
    },
    mainCard: {
        backgroundColor: '#FFFFFF',
        shadowRadius: 4,
        elevation: 3,
        marginBottom: hp(1),
        borderRadius: wp(2),
    },
    addonCard: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: wp(2),
        padding: wp(3),
        borderWidth: 1,
        borderColor: '#E5E5E5',
        alignItems: 'center',
        justifyContent: 'center',
    },
    addonCardSelected: {
        borderColor: '#3DA9B7',
        backgroundColor: '#F0FDFA',
    },
    addonTitle: {
        fontSize: wp(3.5),
        fontWeight: '600',
        color: '#333333',
        marginBottom: hp(0.5),
        textAlign: 'center',
    },
    addonPrice: {
        fontSize: wp(3.5),
        fontWeight: 'bold',
        color: '#3DA9B7',
    },
    selectedBadge: {
        position: 'absolute',
        top: -8,
        right: -8,
        backgroundColor: '#3DA9B7',
        borderRadius: 10,
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    selectedBadgeText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: 'bold',
    },
    dropdownHeader: {
        borderWidth: 1,
        borderColor: '#E5E5E5',
        borderRadius: wp(2.5),
        marginBottom: hp(2),
    },
    dropdownHeaderOpen: {
        backgroundColor: '#F7FCFC',
    },
    dropdownHeaderClosed: {
        backgroundColor: '#FFFFFF',
    },
    dropdownHeaderContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: wp(4),
        paddingVertical: hp(1.5),
    },
    dropdownTitle: {
        fontSize: wp(4),
        fontWeight: 'bold',
        color: '#3DA9B7',
        textAlign: 'left',
    },
    dropdownSubtitle: {
        fontSize: wp(3),
        color: '#000',
        opacity: 0.5,
        textAlign: 'left',
    },
    plansContent: {
        width: '100%',
        paddingBottom: hp(2),
        padding: wp(1),
        borderRadius: wp(2),
    },
    sectionTitle: {
        fontSize: wp(5),
        fontWeight: 'bold',
        color: '#666666',
        textAlign: 'center',
        marginTop: hp(1),
        marginBottom: hp(0.5),
    },
    sectionSubtitle: {
        fontSize: wp(3.5),
        textAlign: 'center',
        color: '#666666',
        marginBottom: hp(2),
    },
    errorContainer: {
        paddingVertical: hp(4),
        alignItems: 'center',
        justifyContent: 'center',
    },
    errorText: {
        color: '#EF4444',
        textAlign: 'center',
        fontSize: wp(3.5),
    },
    plansGrid: {
        width: '100%',
        gap: hp(1.5),
    },
    planRow: {
        flexDirection: 'row',
        gap: wp(3),
        width: '100%',
        justifyContent: 'center',
        marginBottom: hp(1),
    },
    togglesContainer: {
        width: '100%',
    },
    toggleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#F7F7F7',
        borderRadius: wp(3),
        paddingHorizontal: wp(5),
        paddingVertical: hp(2.5),
        marginTop: hp(2),
    },
    toggleLabel: {
        fontSize: wp(3.5),
        fontWeight: '500',
        color: '#626666',
        textAlign: 'left',
        flex: 1,
        marginRight: wp(3),
    },
    toggleSubLabel: {
        fontSize: wp(3),
        fontWeight: '500',
        color: '#626666',
        textAlign: 'left',
        marginTop: hp(0.5),
    },
    guestPhotosContent: {
        paddingBottom: hp(2),
    },
    countersRow: {
        flexDirection: 'row',
        gap: wp(4),
        paddingHorizontal: wp(1),
        marginBottom: hp(1),
        width: '100%',
    },
    counterContainer: {
        flex: 1,
        alignItems: 'center',
        width: '100%',
    },
    counterHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: hp(0.5),
    },
    counterLabel: {
        fontSize: wp(3),
        color: '#666666',
        fontWeight: '500',
    },
    counterPrice: {
        color: '#3DA9B7',
        fontSize: wp(2.5),
        marginRight: wp(1),
        fontWeight: '500',
    },
    counterControls: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
    },
    counterButton: {
        paddingVertical: hp(1),
        paddingHorizontal: wp(3),
        borderRadius: wp(2.5),
        borderWidth: 1,
        borderColor: '#E9E9E9',
        backgroundColor: '#FFFFFF',
    },
    counterButtonDisabled: {
        opacity: 0.5,
    },
    counterButtonText: {
        fontSize: wp(6),
        color: '#808080',
    },
    counterButtonTextDecrement: {
        color: '#808080',
    },
    counterButtonTextIncrement: {
        color: '#3DA9B7',
    },
    counterValue: {
        flex: 1,
        paddingVertical: hp(1.5),
        paddingHorizontal: wp(3),
        marginHorizontal: wp(2),
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: wp(2.5),
        borderWidth: 1,
        borderColor: '#E9E9E9',
        minWidth: wp(20),
    },
    counterValueText: {
        fontSize: wp(4),
        fontWeight: '400',
        color: '#808080',
        textAlign: 'center',
    },
    photoLimitToggleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#F7F7F7',
        paddingHorizontal: wp(5),
        borderRadius: wp(3),
        paddingVertical: hp(2.5),
        marginTop: hp(1),
        width: '98%',
        alignSelf: 'center'
    },
    photoLimitToggleTextContainer: {
        flexDirection: 'column',
        width: '60%',
    },
    photosPerGuestSection: {
        width: '100%',
        padding: wp(1),
        borderRadius: wp(2),
    },
    photosPerGuestLabel: {
        fontSize: wp(3.5),
        fontWeight: '500',
        textAlign: 'left',
        marginTop: hp(1),
        marginBottom: hp(0.5),
        color: '#626666',
    },
    photosPerGuestControls: {
        flexDirection: 'row',
        width: '100%',
        marginBottom: hp(1.5),
        alignItems: 'center',
    },
    photosPerGuestButton: {
        paddingVertical: hp(0.5),
        paddingHorizontal: wp(2),
        borderRadius: wp(1.5),
        borderWidth: 1,
        borderColor: '#B2B2B2',
        alignItems: 'center',
        justifyContent: 'center',
    },
    photosPerGuestButtonText: {
        fontSize: wp(6),
        color: '#B2B2B2',
    },
    photosPerGuestButtonTextIncrement: {
        color: '#3DA9B7',
    },
    photosPerGuestInput: {
        flex: 1,
        marginHorizontal: wp(2),
        paddingVertical: hp(0.75),
        paddingHorizontal: wp(2),
        textAlign: 'center',
        fontSize: wp(4.5),
        color: '#B2B2B2',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderRadius: wp(1.5),
        borderColor: '#E6E6E6',
        minWidth: wp(15),
    },
    photosPerGuestError: {
        color: '#EF4444',
        textAlign: 'center',
        fontSize: wp(3),
        marginBottom: hp(1),
    },
    photosPerGuestHint: {
        color: '#A3A3A3',
        textAlign: 'center',
        fontSize: wp(2.5),
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        marginBottom: wp(2)
    },
    storageDurationHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: hp(3),
        marginBottom: hp(0.5),
    },
    storageDurationTitle: {
        fontSize: wp(3.5),
        fontWeight: '500',
        textAlign: 'left',
        color: '#626666',
    },
    storageDurationSubtitle: {
        fontSize: wp(3),
        fontWeight: '400',
        color: '#ACACAC',
    },
    storageDurationPrice: {
        color: '#3DA9B7',
        fontSize: wp(3),
        fontWeight: '500',
    },
    planDetailsContainer: {
        width: '100%',
        marginTop: 0,
    },
    bottomPadding: {
        height: hp(10),
    },
    fixedBottom: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.04,
        shadowRadius: 16,
        elevation: 8,
        paddingTop: hp(1),
        paddingBottom: hp(1),
        paddingHorizontal: wp(3),
    },
    totalAmountContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        borderRadius: wp(2),
        paddingHorizontal: wp(4),
        paddingVertical: hp(2),
        width: '100%',
        maxWidth: wp(95),
        alignSelf: 'center',
    },
    totalAmountLabel: {
        fontSize: wp(3.8),
        fontWeight: '600',
        color: '#A3A3A3',
    },
    totalAmountValue: {
        fontSize: wp(4.5),
        fontWeight: 'bold',
        color: '#A3A3A3',
    },
});

export default CreateEventSecondStep;
