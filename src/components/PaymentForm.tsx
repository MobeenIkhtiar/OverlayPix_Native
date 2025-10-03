// import React, { useState } from 'react';
// import {
//     View,
//     Text,
//     TouchableOpacity,
//     TextInput,
//     Image,
//     StyleSheet,
//     ActivityIndicator
// } from 'react-native';
// import type { EventPayment } from '../types/createEvent';
// import { CardField } from '@stripe/stripe-react-native';
// import { useCreateEvent } from '../hooks/useCreateEvent';
// import { planService } from '../services/planService';
// import { icons } from '../contants/Icons';
// import { wp, hp } from '../contants/StyleGuide';

// const paymentMethods = [
//     {
//         label: 'Credit Card',
//         value: 'card',
//         icons: [icons.mastercardLogo, icons.visa],
//     },
//     {
//         label: 'Cash App',
//         value: 'cashapp',
//         icons: [icons.cashApp],
//     },
// ];

// interface PaymentFormProps {
//     paymentData?: EventPayment;
//     onDiscountUpdate?: (discount: number) => void;
//     isUpgradeMode: boolean;
//     eventId: string;
//     setAppliedDiscountCode: (val: string) => void;
//     appliedDiscountCode: string;
//     selected: string;
//     setSelected: (val: string) => void;
//     paymentMessage: string;
//     paymentMessageType: string;
// }

// const PaymentForm: React.FC<PaymentFormProps> = ({
//     onDiscountUpdate,
//     isUpgradeMode,
//     setAppliedDiscountCode,
//     appliedDiscountCode,
//     selected,
//     setSelected,
//     paymentMessage,
//     paymentMessageType
// }) => {
//     const [discount, setDiscount] = useState('');
//     const [CodeLoading, setCodeLoading] = useState<boolean>(false);

//     const [discountMessage, setDiscountMessage] = useState('');
//     const [discountMessageType, setDiscountMessageType] = useState<'success' | 'error' | ''>('');

//     const { step2Data } = useCreateEvent();
//     const isFreePlan = step2Data?.plan?.finalPrice === 0;

//     const handleApplyDicountCode = async (discountCode: string) => {
//         setCodeLoading(true);
//         setDiscountMessage('');
//         setDiscountMessageType('');
//         try {
//             const res = await planService.validateDiscountCode(discountCode);
//             if (
//                 res.success &&
//                 res.data &&
//                 res.data.isValid === true &&
//                 res.data.discountCode
//             ) {
//                 const { discountType, discountValue, code } = res.data.discountCode;
//                 setDiscountMessage(
//                     `Discount applied! ${discountValue}${discountType === 'percentage' ? '%' : ''} off with code "${code}".`
//                 );
//                 setDiscountMessageType('success');
//                 setAppliedDiscountCode(code);

//                 let discountAmount = 0;
//                 if (discountType === 'percentage') {
//                     if (typeof step2Data?.plan?.finalPrice === 'number') {
//                         discountAmount = (step2Data.plan.finalPrice * discountValue) / 100;
//                     }
//                 } else {
//                     discountAmount = discountValue;
//                 }
//                 onDiscountUpdate?.(discountAmount);
//             } else {
//                 setDiscountMessage(res.message || 'Invalid discount code.');
//                 setDiscountMessageType('error');
//             }
//         } catch (error) {
//             setDiscountMessage('Failed to validate discount code.');
//             setDiscountMessageType('error');
//         } finally {
//             setCodeLoading(false);
//         }
//     };

//     const handleClearDiscountCode = () => {
//         setAppliedDiscountCode('');
//         setDiscount('');
//         setDiscountMessage('');
//         setDiscountMessageType('');
//         onDiscountUpdate?.(0);
//     };

//     return (
//         <View style={styles.container}>
//             <Text style={styles.title}>Payment</Text>
//             {step2Data?.plan?.finalPrice > 0 && (
//                 <Text style={styles.subtitle}>Complete your purchase</Text>
//             )}

//             {/* Payment method selection */}
//             {!isFreePlan && (
//                 <View style={styles.paymentMethodsContainer}>
//                     {paymentMethods.map((method: any) => {
//                         const isSelected = selected === method.value;

//                         return (
//                             <TouchableOpacity
//                                 key={method.value}
//                                 style={[
//                                     styles.paymentMethodButton,
//                                     isSelected && styles.paymentMethodButtonSelected
//                                 ]}
//                                 onPress={() => {
//                                     setSelected(method.value);
//                                 }}
//                                 activeOpacity={0.7}
//                             >
//                                 <Text style={styles.paymentMethodLabel}>{method.label}</Text>
//                                 <View style={styles.paymentMethodIcons}>
//                                     {method.icons.map((icon: any, i: number) => (
//                                         <Image
//                                             key={i}
//                                             source={icon}
//                                             style={styles.paymentIcon}
//                                             resizeMode="contain"
//                                         />
//                                     ))}
//                                 </View>
//                             </TouchableOpacity>
//                         );
//                     })}
//                 </View>
//             )}

//             {/* Card Payment */}
//             {!isFreePlan && selected === 'card' && (
//                 <View style={styles.cardDetailsContainer}>
//                     <Text style={styles.label}>Card Details</Text>
//                     <CardField
//                         postalCodeEnabled={false}
//                         placeholders={{
//                             number: '4242 4242 4242 4242',
//                         }}
//                         cardStyle={{
//                             backgroundColor: '#FFFFFF',
//                             textColor: '#333333',
//                             borderColor: '#E6F7FA',
//                             borderWidth: 1,
//                             borderRadius: wp(2),
//                         }}
//                         style={styles.cardField}
//                     />
//                 </View>
//             )}

//             {/* Cash App Payment */}
//             {!isFreePlan && selected === 'cashapp' && (
//                 <View style={styles.cashAppContainer}>
//                     <Text style={styles.label}>Cash App Payment</Text>
//                     <View style={styles.cashAppBox}>
//                         <View style={styles.cashAppContent}>
//                             <Image
//                                 source={icons.cashApp}
//                                 style={styles.cashAppIcon}
//                                 resizeMode="contain"
//                             />
//                             <Text style={styles.cashAppText}>
//                                 Cash App payment will be processed securely
//                             </Text>
//                         </View>
//                     </View>
//                 </View>
//             )}

//             {/* Apple Pay / Google Pay - TODO: Implement with React Native Stripe native payment methods */}
//             {!isFreePlan && (selected === 'apple' || selected === 'google') && (
//                 <View style={styles.digitalPaymentContainer}>
//                     <Text style={styles.placeholderText}>
//                         {selected === 'apple' ? 'Apple Pay' : 'Google Pay'} coming soon
//                     </Text>
//                 </View>
//             )}

//             {/* Discount Code */}
//             {step2Data?.plan?.finalPrice > 0 && !isUpgradeMode && (
//                 <View style={styles.discountContainer}>
//                     <Text style={styles.label}>Discount Code</Text>
//                     <View style={styles.discountInputRow}>
//                         <TextInput
//                             style={styles.discountInput}
//                             placeholder="234151-afs"
//                             placeholderTextColor="#999999"
//                             value={discount}
//                             onChangeText={setDiscount}
//                             editable={!appliedDiscountCode}
//                         />
//                         {appliedDiscountCode ? (
//                             <TouchableOpacity
//                                 style={styles.clearButton}
//                                 onPress={handleClearDiscountCode}
//                                 activeOpacity={0.7}
//                             >
//                                 <Text style={styles.clearButtonText}>Clear</Text>
//                             </TouchableOpacity>
//                         ) : (
//                             <TouchableOpacity
//                                 style={[
//                                     styles.applyButton,
//                                     (CodeLoading || !discount.trim()) && styles.applyButtonDisabled
//                                 ]}
//                                 onPress={() => handleApplyDicountCode(discount)}
//                                 disabled={CodeLoading || !discount.trim()}
//                                 activeOpacity={0.7}
//                             >
//                                 {CodeLoading ? (
//                                     <ActivityIndicator size="small" color="#FFFFFF" />
//                                 ) : (
//                                     <Text style={styles.applyButtonText}>Apply</Text>
//                                 )}
//                             </TouchableOpacity>
//                         )}
//                     </View>
//                     {discountMessage && (
//                         <Text style={[
//                             styles.discountMessage,
//                             discountMessageType === 'success' ? styles.successMessage : styles.errorMessage
//                         ]}>
//                             {discountMessage}
//                         </Text>
//                     )}
//                 </View>
//             )}

//             {paymentMessage && (
//                 <Text style={[
//                     styles.paymentMessage,
//                     paymentMessageType === 'success' ? styles.successMessage : styles.errorMessage
//                 ]}>
//                     {paymentMessage}
//                 </Text>
//             )}
//         </View>
//     );
// };

// const styles = StyleSheet.create({
//     container: {
//         width: '100%',
//     },
//     title: {
//         fontSize: wp(5.5),
//         fontWeight: 'bold',
//         color: '#3DA9B7',
//         textAlign: 'left',
//         marginBottom: hp(0.5),
//     },
//     subtitle: {
//         fontSize: wp(3.5),
//         color: '#666666',
//         fontWeight: '400',
//         textAlign: 'left',
//         marginBottom: hp(2),
//     },
//     paymentMethodsContainer: {
//         gap: hp(1),
//         marginBottom: hp(2),
//     },
//     paymentMethodButton: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         justifyContent: 'space-between',
//         paddingHorizontal: wp(4),
//         paddingVertical: hp(1.5),
//         borderRadius: wp(2),
//         borderWidth: 1,
//         borderColor: '#CCCCCC',
//         backgroundColor: '#FFFFFF',
//     },
//     paymentMethodButtonSelected: {
//         backgroundColor: '#EFF8F9',
//         borderColor: '#86C9D2',
//     },
//     paymentMethodButtonDisabled: {
//         opacity: 0.5,
//     },
//     paymentMethodLabel: {
//         fontWeight: '500',
//         fontSize: wp(3),
//         color: '#626B6C',
//     },
//     paymentMethodIcons: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         gap: wp(2),
//     },
//     paymentIcon: {
//         height: hp(2),
//         width: wp(8),
//     },
//     cardDetailsContainer: {
//         gap: hp(1.5),
//         marginTop: hp(1),
//     },
//     label: {
//         fontSize: wp(4),
//         color: '#666666',
//         fontWeight: '500',
//         textAlign: 'left',
//     },
//     cardField: {
//         width: '100%',
//         height: hp(6),
//         marginVertical: hp(1),
//     },
//     placeholderText: {
//         fontSize: wp(3.5),
//         color: '#999999',
//         textAlign: 'center',
//     },
//     cashAppContainer: {
//         gap: hp(1.5),
//         marginTop: hp(1),
//     },
//     cashAppBox: {
//         borderWidth: 1,
//         borderColor: '#E6F7FA',
//         borderRadius: wp(2),
//         paddingHorizontal: wp(3),
//         paddingVertical: hp(2),
//         minHeight: hp(5),
//         backgroundColor: '#F9F9F9',
//     },
//     cashAppContent: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         justifyContent: 'center',
//         height: hp(5),
//     },
//     cashAppIcon: {
//         height: hp(3),
//         width: wp(6),
//         marginRight: wp(2),
//     },
//     cashAppText: {
//         fontSize: wp(3.5),
//         color: '#666666',
//     },
//     digitalPaymentContainer: {
//         marginTop: hp(2),
//         padding: hp(2),
//         borderWidth: 1,
//         borderColor: '#E6F7FA',
//         borderRadius: wp(2),
//         backgroundColor: '#FFFFFF',
//     },
//     loadingContainer: {
//         marginTop: hp(2),
//         flexDirection: 'row',
//         alignItems: 'center',
//         justifyContent: 'center',
//         height: hp(6),
//         borderWidth: 1,
//         borderColor: '#E6E6E6',
//         borderRadius: wp(2),
//         backgroundColor: '#F5F5F5',
//         gap: wp(2),
//     },
//     loadingText: {
//         fontSize: wp(3.5),
//         color: '#666666',
//     },
//     discountContainer: {
//         marginTop: hp(2),
//     },
//     discountInputRow: {
//         flexDirection: 'row',
//         gap: wp(2),
//         marginTop: hp(0.5),
//     },
//     discountInput: {
//         flex: 1,
//         borderWidth: 1,
//         borderColor: '#E6F7FA',
//         fontSize: wp(3),
//         borderRadius: wp(2),
//         paddingHorizontal: wp(3),
//         paddingVertical: hp(1.5),
//         backgroundColor: '#FFFFFF',
//         color: '#333333',
//     },
//     clearButton: {
//         backgroundColor: '#EF4444',
//         paddingHorizontal: wp(4),
//         paddingVertical: hp(1.5),
//         borderRadius: wp(2),
//         justifyContent: 'center',
//         alignItems: 'center',
//         shadowColor: '#000',
//         shadowOffset: { width: 0, height: 2 },
//         shadowOpacity: 0.1,
//         shadowRadius: 3,
//         elevation: 2,
//     },
//     clearButtonText: {
//         fontSize: wp(3.5),
//         color: '#FFFFFF',
//         fontWeight: '600',
//     },
//     applyButton: {
//         backgroundColor: '#3DA9B7',
//         paddingHorizontal: wp(8),
//         paddingVertical: hp(1.5),
//         borderRadius: wp(2),
//         justifyContent: 'center',
//         alignItems: 'center',
//         shadowColor: '#000',
//         shadowOffset: { width: 0, height: 2 },
//         shadowOpacity: 0.1,
//         shadowRadius: 3,
//         elevation: 2,
//         minWidth: wp(20),
//     },
//     applyButtonDisabled: {
//         opacity: 0.5,
//     },
//     applyButtonText: {
//         fontSize: wp(3.5),
//         color: '#FFFFFF',
//         fontWeight: '600',
//     },
//     discountMessage: {
//         fontSize: wp(3),
//         marginTop: hp(0.5),
//     },
//     paymentMessage: {
//         fontSize: wp(3.5),
//         marginTop: hp(1),
//     },
//     successMessage: {
//         color: '#16A34A',
//     },
//     errorMessage: {
//         color: '#EF4444',
//     },
// });

// export default PaymentForm;
