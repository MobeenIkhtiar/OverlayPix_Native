import React from 'react';
import { View, StyleSheet } from 'react-native';
import { wp, hp } from '../contants/StyleGuide';

interface StepperProps {
    steps?: number;
    activeStep?: number;
}

const Stepper: React.FC<StepperProps> = ({ steps = 4, activeStep = 1 }) => {
    return (
        <View style={styles.container}>
            {Array.from({ length: steps }).map((_, idx) => {
                const isActive = idx === activeStep - 1;
                const isCompleted = idx < activeStep - 1;
                const leftLineActive = idx !== 0 && idx <= activeStep - 1 && activeStep > 1;

                return (
                    <React.Fragment key={idx}>
                        {/* Left line (only if not first step) */}
                        {idx !== 0 && (
                            <View
                                style={[
                                    styles.line,
                                    leftLineActive
                                        ? styles.lineActive
                                        : styles.lineInactive,
                                ]}
                            />
                        )}

                        {/* Circle */}
                        <View
                            style={[
                                styles.circle,
                                (isActive || isCompleted)
                                    ? styles.circleActive
                                    : styles.circleInactive,
                            ]}
                        >
                            <View
                                style={[
                                    styles.innerCircle,
                                    (isActive || isCompleted)
                                        ? styles.innerCircleActive
                                        : styles.innerCircleInactive,
                                ]}
                            />
                        </View>

                        {/* Right line (only if not last step) */}
                        {idx !== steps - 1 && (
                            <View style={[styles.line, styles.lineInactive]} />
                        )}
                    </React.Fragment>
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        paddingHorizontal: wp(5),
        marginTop: hp(1),
        marginBottom: hp(3),
    },
    line: {
        height: 0,
        flex: 1,
        borderTopWidth: wp(0.6),
        borderStyle: 'dashed',
        marginHorizontal: wp(1),
    },
    lineActive: {
        borderTopColor: '#3DA9B7',
    },
    lineInactive: {
        borderTopColor: '#A6AAB4',
    },
    circle: {
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: wp(4),
        width: wp(8),
        height: wp(8),
        borderWidth: wp(0.8),
        backgroundColor: '#fff',
    },
    circleActive: {
        borderColor: '#3DA9B7',
    },
    circleInactive: {
        borderColor: '#A6AAB4',
    },
    innerCircle: {
        borderRadius: wp(2),
        width: wp(4),
        height: wp(4),
    },
    innerCircleActive: {
        backgroundColor: '#3DA9B7',
    },
    innerCircleInactive: {
        backgroundColor: '#D3D6DB',
    },
});

export default Stepper;
