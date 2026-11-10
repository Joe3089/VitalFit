import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';

type MonthCalendarProps = {
	onDateSelect?: (date: DateData) => void;
	markedDates?: {
		[date: string]: {
			marked?: boolean;
			dotColor?: string;
			selected?: boolean;
			selectedColor?: string;
		};
	};
	initialDate?: string;
	onMonthChange?: (date: DateData) => void;
};

export const MonthCalendar: React.FC<MonthCalendarProps> = ({
	onDateSelect,
	onMonthChange,
	markedDates = {},
	initialDate,
}) => {
	const [selectedDate, setSelectedDate] = useState(initialDate);

	// Get today's date in YYYY-MM-DD format
	const today = new Date();
	const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

	// Merge user's markedDates with our selected date and today indicator
	const mergedMarkedDates = {
		...markedDates,
		...(selectedDate && {
			[selectedDate]: {
				selected: true,
				selectedColor: '#F97316',
				...markedDates[selectedDate],
			},
		}),
		...(todayString !== selectedDate && {
			[todayString]: {
				marked: true,
				dotColor: '#F97316',
				...markedDates[todayString],
			},
		}),
	};

	const handleDayPress = (day: DateData) => {
		setSelectedDate(day.dateString);
		onDateSelect?.(day);
	};

	return (
		<View style={styles.wrapper}>
			<Calendar
				initialDate={initialDate}
				markedDates={mergedMarkedDates}
				onDayPress={handleDayPress}
				onMonthChange={(month) => onMonthChange?.(month)}
				theme={{
					backgroundColor: '#ffffff',
					calendarBackground: '#ffffff',
					textSectionTitleColor: '#6B7280',
					monthTextColor: '#111827',
					dayTextColor: '#111827',
					todayTextColor: '#F97316',
					textDisabledColor: '#D1D5DB',
					arrowColor: '#111827',
					selectedDayBackgroundColor: '#F97316',
					selectedDayTextColor: '#FFFFFF',
				}}
				hideExtraDays={false}
				enableSwipeMonths
			/>
		</View>
	);
};

const styles = StyleSheet.create({
	wrapper: {
		borderWidth: 1,
		borderColor: '#e5e7eb',
		borderRadius: 12,
		overflow: 'hidden',
	},
});

export default MonthCalendar;
