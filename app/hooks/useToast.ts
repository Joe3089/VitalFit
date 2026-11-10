import { useState } from 'react';

type ToastType = 'success' | 'error' | 'warning';

interface ToastState {
	visible: boolean;
	type: ToastType;
	title: string;
	message: string;
}

export const useToast = () => {
	const [toastState, setToastState] = useState<ToastState>({
		visible: false,
		type: 'success',
		title: '',
		message: '',
	});

	const showToast = (type: ToastType, title: string, message: string) => {
		setToastState({ visible: true, type, title, message });
	};

	const hideToast = () => {
		setToastState((prevState) => ({ ...prevState, visible: false }));
	};

	return {
		toastState,
		showToast,
		hideToast,
	};
};
