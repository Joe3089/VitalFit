import { z } from 'zod';

export const ForgotPasswordSchema = z
	.object({
		password: z
			.string()
			.min(8, 'La contraseña debe tener al menos 8 caracteres.')
			.regex(/[A-Z]/, 'La contraseña debe tener al menos una mayúscula.')
			.regex(/[a-z]/, 'La contraseña debe tener al menos una minúscula.')
			.regex(/[0-9]/, 'La contraseña debe tener al menos un número.')
			.regex(/[^a-zA-Z0-9]/, 'La contraseña debe tener al menos un caracter especial.'),
		confirmPassword: z.string(),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: 'Las contraseñas no coinciden.',
		path: ['confirmPassword'],
	});

export type ForgotPasswordData = z.infer<typeof ForgotPasswordSchema>;
