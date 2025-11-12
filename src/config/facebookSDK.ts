import { Settings } from 'react-native-fbsdk-next';

export const configureFacebookSDK = () => {
    Settings.setAppID('1152635456681077');
    Settings.setClientToken('93d22da508519214744f2d2ac0e1ffaa');
    Settings.initializeSDK();
    // Settings.setAdvertiserTrackingEnabled(true);
    console.log('Facebook SDK configured successfully');
};
