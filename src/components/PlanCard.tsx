// import React from 'react';
// import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
// import { Plan } from '../types/plan';
// import { hp, wp } from '../contants/StyleGuide';

// interface PlanCardProps {
//     plan: Plan;
//     highlighted?: boolean;
//     onClick?: () => void;
//     selected?: boolean;
//     isEditMode?: boolean;
// }

// const PlanCard: React.FC<PlanCardProps> = ({ plan, highlighted, onClick, selected, isEditMode }) => {
//     const handleClick = () => {
//         if (isEditMode) return; // Disable click in edit mode
//         if (onClick) {
//             onClick();
//         }
//     };

//     // Get storage range display
//     const getStorageRange = () => {
//         if (plan.storageOptions && plan.storageOptions.length > 0) {
//             const minDays = Math.min(...plan.storageOptions.map(option => option.days));
//             return `${minDays} days storage`;
//         }
//         return `${plan.defaultStorageDays} days storage`;
//     };

//     // Dynamic styles
//     const cardStyle = [
//         styles.card,
//         isEditMode && styles.cardDisabled,
//         (selected || highlighted) && styles.cardSelected,
//         !selected && !highlighted && styles.cardDefault,
//     ];

//     return (
//         <TouchableOpacity
//             style={cardStyle}
//             onPress={handleClick}
//             activeOpacity={isEditMode ? 1 : 0.8}
//             disabled={isEditMode}
//         >
//             <Text style={styles.planName}>{plan.name}</Text>
//             <Text style={styles.planPrice}>${plan.price}</Text>
//             <Text style={styles.planInfo}>
//                 {plan.guestLimit} guests • {plan.photoPool} photos • {getStorageRange()}
//             </Text>
//             <View style={styles.featuresList}>
//                 {plan.features.map((feature, index) => (
//                     <View key={index} style={styles.featureItem}>
//                         <Text style={styles.bullet}>{'\u2022'}</Text>
//                         <Text style={styles.featureText}>{feature}</Text>
//                     </View>
//                 ))}
//             </View>
//         </TouchableOpacity>
//     );
// };

// const styles = StyleSheet.create({
//     card: {
//         flex: 1,
//         borderRadius: wp(3),
//         borderWidth: 1,
//         paddingHorizontal: wp(3),
//         paddingVertical: hp(2.5),
//         marginVertical: hp(0.5),
//         marginHorizontal: wp(1),
//     },
//     cardSelected: {
//         backgroundColor: '#F7FCFC',
//         borderColor: '#3DA9B7',
//         shadowColor: '#3DA9B7',
//         shadowOffset: { width: 0, height: 2 },
//         shadowOpacity: 0.12,
//         shadowRadius: 4,
//         elevation: 2,
//     },
//     cardDefault: {
//         backgroundColor: '#fff',
//         borderColor: '#3DA9B7',
//         borderStyle: 'dashed',
//     },
//     cardDisabled: {
//         opacity: 0.6,
//     },
//     planName: {
//         textAlign: 'center',
//         fontWeight: 'bold',
//         fontSize: wp(4.5),
//         marginBottom: hp(0.5),
//         color: '#222',
//     },
//     planPrice: {
//         textAlign: 'center',
//         fontWeight: 'bold',
//         fontSize: wp(5),
//         marginBottom: hp(0.5),
//         color: '#3DA9B7',
//     },
//     planInfo: {
//         textAlign: 'center',
//         color: '#B3B3B3',
//         fontSize: wp(3),
//         marginBottom: hp(1.2),
//     },
//     featuresList: {
//         marginTop: hp(0.5),
//         paddingLeft: wp(2),
//     },
//     featureItem: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         marginBottom: hp(0.5),
//     },
//     bullet: {
//         color: '#666666',
//         fontSize: wp(3.5),
//         marginRight: wp(1),
//     },
//     featureText: {
//         color: '#666666',
//         fontSize: wp(2.7),
//     },
// });

// export default PlanCard;