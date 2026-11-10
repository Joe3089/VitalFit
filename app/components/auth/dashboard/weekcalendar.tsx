import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { DateData } from 'react-native-calendars';

const { width: screenWidth } = Dimensions.get('window');

interface DayData {
	label: string;
	date: number;
	dateString: string;
	fullDate: Date;
	hasEvent?: boolean;
}

interface WeekCalendarProps {
	onDateSelect?: (date: DateData) => void;
	markedDates?: { [date: string]: { marked?: boolean; dotColor?: string } };
	initialDate?: string;
}

const EMPTY_MARKED_DATES: { [date: string]: { marked?: boolean; dotColor?: string } } = {};

export const WeekCalendar: React.FC<WeekCalendarProps> = ({
	onDateSelect,
	markedDates = EMPTY_MARKED_DATES,
	initialDate,
}) => {
	const { t } = useTranslation();
	// Helper to format date as YYYY-MM-DD in local timezone
	const formatLocalDate = (date: Date): string => {
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');
		return `${year}-${month}-${day}`;
	};

	const [selectedDateString, setSelectedDateString] = useState(
		initialDate !== undefined ? initialDate : formatLocalDate(new Date()),
	);
	const [weekDays, setWeekDays] = useState<DayData[]>([]);

	useEffect(() => {
		const generateWeekDays = () => {
			const today = new Date();
			const days: DayData[] = [];
			const dayLabels = t('common.weekdaysShort', { returnObjects: true }) as string[];

			// Show today + next 6 days (7 days total, looking forward)
			for (let i = 0; i < 7; i++) {
				const date = new Date(today);
				date.setDate(today.getDate() + i);

				const dateString = formatLocalDate(date);
				const hasEvent = markedDates[dateString]?.marked || false;
				const dayOfWeek = date.getDay();
				const labelIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Sunday is 0, map to index 6

				days.push({
					label: dayLabels[labelIndex],
					date: date.getDate(),
					dateString: dateString,
					fullDate: date,
					hasEvent,
				});
			}

			setWeekDays(days);
		};

		generateWeekDays();
	}, [markedDates, t]);

	const handleDayPress = (day: DayData) => {
		setSelectedDateString(day.dateString);

		const dateData: DateData = {
			dateString: day.dateString,
			day: day.date,
			month: day.fullDate.getMonth() + 1,
			year: day.fullDate.getFullYear(),
			timestamp: day.fullDate.getTime(),
		};

		onDateSelect?.(dateData);
	};

	const isSelected = (day: DayData) => {
		return day.dateString === selectedDateString;
	};

	const isToday = (day: DayData) => {
		const today = formatLocalDate(new Date());
		return day.dateString === today;
	};

	return (
		<View style={styles.container}>
			{weekDays.map((day) => {
				const selected = isSelected(day);
				const today = isToday(day);

				return (
					<TouchableOpacity
						key={day.label}
						onPress={() => handleDayPress(day)}
						activeOpacity={0.8}
						style={[styles.dayButton, selected && styles.selectedDay]}>
						<Text className='font-body' style={[styles.dayLabel, selected && styles.selectedText]}>
							{day.label}
						</Text>
						<Text
							className='font-body'
							style={[
								styles.dateNumber,
								selected && styles.selectedText,
								today && !selected && styles.todayText,
							]}>
							{day.date}
						</Text>
						{day.hasEvent && !selected && <View style={styles.eventDot} />}
					</TouchableOpacity>
				);
			})}
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		borderWidth: 1,
		borderColor: '#e5e7eb',
		borderRadius: 12,
		padding: 16,
		width: screenWidth - 32,
		alignSelf: 'center',
		height: 94,
		backgroundColor: '#ffffff',
	},
	dayButton: {
		alignItems: 'center',
		justifyContent: 'center',
		width: (screenWidth - 32 - 6 * 4) / 7,
		height: 62,
		borderRadius: 16,
		paddingVertical: 12,
		gap: 4,
		backgroundColor: 'transparent',
	},
	selectedDay: {
		backgroundColor: '#F97316',
	},
	dayLabel: {
		fontFamily: 'Montserrat_500Medium',
		fontSize: 13,
		fontWeight: '500',
		color: '#6b7280',
	},
	dateNumber: {
		fontFamily: 'Montserrat_600SemiBold',
		fontSize: 15,
		fontWeight: '600',
		color: '#111827',
	},
	selectedText: {
		color: '#FFFFFF',
	},
	todayText: {
		color: '#F97316',
	},
	eventDot: {
		position: 'absolute',
		bottom: 8,
		width: 4,
		height: 4,
		borderRadius: 2,
		backgroundColor: '#F97316',
	},
});
