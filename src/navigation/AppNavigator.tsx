import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from '../screens/auth/login';
import SignupScreen from '../screens/auth/signup';
import DashboardScreen from '../screens/dashboard';
import ProfileScreen from '../screens/profileScreen';
import CreateEventScreen from '../screens/createEventScreen';
import EventCreatedScreen from '../screens/eventCreatedScreen/EventCreatedScreen';
import CreateEventSecondStep from '../screens/createEventSecondStep';
import CreateEventThirdStep from '../screens/createEventThirdStep';
import CreateEventFourthStep from '../screens/createEventFourthStep';
import InviteGuestEasily from '../screens/inviteGuestEasily';
import UpgradeEventScreen from '../screens/updagradeEventScreen';
import JoinedEvents from '../screens/users/joinedEvent';
import TermsAndPolicy from '../screens/users/terms&policy';
import TakePictureScreen from '../screens/users/takepictureScreen';
import PhotoSavedScreen from '../screens/users/photoSavedScreen';
import UserGalleryScreen from '../screens/users/userGalleryScreen';
import ViewImageScreen from '../screens/users/viewImageScreen';

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
                <Stack.Screen name='CreateEventSecondStep' component={CreateEventSecondStep} />
                <Stack.Screen name='CreateEventThirdStep' component={CreateEventThirdStep} />
                <Stack.Screen name='CreateEventFourthStep' component={CreateEventFourthStep} />
                <Stack.Screen name='eventCreatedScreen' component={EventCreatedScreen} />
                <Stack.Screen name='inviteGuestEasily' component={InviteGuestEasily} />
                <Stack.Screen name='upgradeEvent' component={UpgradeEventScreen} />
                {/* users */}
                <Stack.Screen name='joinedEvent' component={JoinedEvents} />
                <Stack.Screen name='termsAndPolicy' component={TermsAndPolicy} />
                <Stack.Screen name='takePicture' component={TakePictureScreen} />
                <Stack.Screen name='photoSaved' component={PhotoSavedScreen} />
                <Stack.Screen name='userGallery' component={UserGalleryScreen} />
                <Stack.Screen name='viewImage' component={ViewImageScreen} />
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default AppNavigator;
