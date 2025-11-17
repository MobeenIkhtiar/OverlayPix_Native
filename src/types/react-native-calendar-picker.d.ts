declare module 'react-native-calendar-picker' {
    import * as React from 'react';
    import { ViewStyle, TextStyle } from 'react-native';

    export interface CalendarPickerProps {
        selectedStartDate?: Date;
        minDate?: Date;
        onDateChange?: (date: Date, type?: 'START_DATE' | 'END_DATE') => void;
        width?: number;
        height?: number;
        selectedDayColor?: string;
        selectedDayTextColor?: string;
        todayBackgroundColor?: string;
        textStyle?: TextStyle;
        style?: ViewStyle;
    }

    export default class CalendarPicker extends React.Component<CalendarPickerProps> { }
}
