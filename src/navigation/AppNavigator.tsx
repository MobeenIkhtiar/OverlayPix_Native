import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from '../screens/auth/login';
import SignupScreen from '../screens/auth/signup';
import DashboardScreen from '../screens/dashboard';
import ProfileScreen from '../screens/profileScreen';
import CreateEventScreen from '../screens/createEventScreen';
// import CreateEventSecondStep from '../screens/createEventSecondStep';
// import CreateEventThirdStep from '../screens/createEventThirdStep';
// import CreateEventFourthStep from '../screens/createEventFourthStep';

const Stack = createStackNavigator();

const AppNavigator = () => {
    return (
        <NavigationContainer>
            <Stack.Navigator initialRouteName="login" screenOptions={{ headerShown: false }}>
                <Stack.Screen name="login" component={LoginScreen} />
                <Stack.Screen name="signup" component={SignupScreen} />
                <Stack.Screen name='dashboard' component={DashboardScreen} />
                <Stack.Screen name='profile' component={ProfileScreen} />
                <Stack.Screen name='createEvent' component={CreateEventScreen} />
                {/* <Stack.Screen name='CreateEventSecondStep' component={CreateEventSecondStep} />
                <Stack.Screen name='CreateEventThirdStep' component={CreateEventThirdStep} />
                <Stack.Screen name='CreateEventFourthStep' component={CreateEventFourthStep} /> */}
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default AppNavigator;
