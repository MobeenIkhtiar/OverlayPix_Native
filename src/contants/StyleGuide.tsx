import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const WIDTH = width;
export const HEIGHT = height;

export const hp = (percentage: number) => {
    return (height * percentage) / 100;
};

export const wp = (percentage: number) => {
    return (width * percentage) / 100;
};
