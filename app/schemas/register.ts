import { TFunction } from 'i18next';
import { z } from 'zod';

export const createStep1Schema = (t: TFunction) =>
	z.object({
		gender: z.enum(['female', 'male', 'prefer-not-to-say'], {
			errorMap: () => ({ message: t('validations.genderRequired') }),
		}),
	});

export const createStep2Schema = (t: TFunction) =>
	z
		.object({
			email: z
				.string({ required_error: t('step2Credentials.emailRequired') })
				.email(t('login.toast.invalidEmail')),
			password: z
				.string({ required_error: t('step2Credentials.passwordRequired') })
				.min(8, t('validations.password.min', { min: 8 }))
				.regex(/[A-Z]/, t('validations.password.uppercase'))
				.regex(/[a-z]/, t('validations.password.lowercase'))
				.regex(/[0-9]/, t('validations.password.number'))
				.regex(/[^a-zA-Z0-9]/, t('validations.password.special')),
			confirmPassword: z.string({ required_error: t('step2Credentials.confirmPasswordRequired') }),
		})
		.refine((data) => data.password === data.confirmPassword, {
			message: t('validations.password.mismatch'),
			path: ['confirmPassword'],
		});

export const createRegisterSchema = (t: TFunction) =>
	z
		.object({
			gender: z.enum(['female', 'male', 'prefer-not-to-say'], {
				errorMap: () => ({ message: t('validations.genderRequired') }),
			}),
			email: z
				.string({ required_error: t('step2Credentials.emailRequired') })
				.email(t('login.toast.invalidEmail')),
			password: z
				.string({ required_error: t('step2Credentials.passwordRequired') })
				.min(8, t('validations.password.min', { min: 8 }))
				.regex(/[A-Z]/, t('validations.password.uppercase'))
				.regex(/[a-z]/, t('validations.password.lowercase'))
				.regex(/[0-9]/, t('validations.password.number'))
				.regex(/[^a-zA-Z0-9]/, t('validations.password.special')),
			confirmPassword: z.string({ required_error: t('step2Credentials.confirmPasswordRequired') }),
			name: z
				.string({ required_error: t('step3PersonalDetails.nameRequired') })
				.min(1, t('step3PersonalDetails.nameRequired'))
				.regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/, t('validations.name.letters')),
			lastName: z
				.string({ required_error: t('step3PersonalDetails.lastNameRequired') })
				.min(1, t('step3PersonalDetails.lastNameRequired'))
				.regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/, t('validations.lastName.letters')),
			documentId: z
				.string({ required_error: t('step3PersonalDetails.documentIdRequired') })
				.min(6, t('validations.documentId.min', { min: 6 }))
				.regex(/^[0-9]+$/, t('validations.documentId.numeric')),
			birthDate: z
				.string({ required_error: t('step3PersonalDetails.birthDateRequired') })
				.min(1, t('step3PersonalDetails.birthDateRequired'))
				.refine(
					(date) => {
						const birthDate = new Date(date);
						const today = new Date();
						let age = today.getFullYear() - birthDate.getFullYear();
						const m = today.getMonth() - birthDate.getMonth();
						if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
							age--;
						}
						return age >= 12;
					},
					{ message: t('validations.birthDate.adult') },
				),
			phone: z
				.string({ required_error: t('validations.phoneRequired') })
				.min(1, t('validations.phoneRequired'))
				.refine(
					(phone) => {
						const numericPhone = phone.replace(/\D/g, '');
						return numericPhone.length >= 10 && numericPhone.length <= 15;
					},
					{ message: t('validations.phone.length') },
				),
			acceptTerms: z.boolean().refine((val) => val === true, {
				message: t('validations.acceptTerms'),
			}),
			profile_picture_url: z.string().optional().nullable(),
			role_name: z.string().optional().nullable(),
		})
		.refine((data) => data.password === data.confirmPassword, {
			message: t('validations.password.mismatch'),
			path: ['confirmPassword'],
		});

export type RegisterData = z.infer<ReturnType<typeof createRegisterSchema>>;
