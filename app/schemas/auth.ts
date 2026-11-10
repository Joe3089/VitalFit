import { LoginRequest } from '@vitalfit/sdk';
import { z } from 'zod';

export const LoginSchema: z.ZodType<LoginRequest> = z.object({
	email: z.string().email({ message: 'Por favor, introduce un correo válido.' }),
	password: z.string().min(6, { message: 'La contraseña debe tener al menos 6 caracteres.' }),
	context: z.string().optional(), 
});

export type LoginData = z.infer<typeof LoginSchema>;
