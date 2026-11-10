import clsx from 'clsx';
import React from 'react';
import { View, ViewProps } from 'react-native';

interface CardProps extends ViewProps {
	className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className, ...props }) => {
	return (
		<View
			{...props}
			className={clsx(
				'bg-white dark:bg-neutral-900 rounded-2xl border border-gray-200 dark:border-neutral-800 shadow-sm',
				className,
			)}>
			{children}
		</View>
	);
};

interface CardContentProps extends ViewProps {
	className?: string;
}

export const CardContent: React.FC<CardContentProps> = ({ children, className, ...props }) => {
	return (
		<View {...props} className={clsx('p-4', className)}>
			{children}
		</View>
	);
};
