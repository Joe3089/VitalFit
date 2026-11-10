import { z } from 'zod';

export const MembershipCheckoutSchema = z.object({
  startDate: z
    .string()
    .min(1, 'La fecha de inicio es requerida.'),
});

export type MembershipCheckoutData = z.infer<typeof MembershipCheckoutSchema>;

export const MembershipPaymentSchema = z.object({
  id: z.string().min(1, 'El plan seleccionado es inválido.'),
  title: z.string().min(1, 'El nombre del plan es requerido.'),
  price: z.string().min(1, 'El precio del plan es requerido.'),
  branch: z.string().min(1, 'La sucursal es requerida.'),
  addonsJson: z.string().optional(),
});

export type MembershipPaymentData = z.infer<typeof MembershipPaymentSchema>;

export const MembershipTransferPaymentSchema = MembershipPaymentSchema.extend({
  reference: z
    .string()
    .min(4, 'La referencia debe tener al menos 4 dígitos.')
    .regex(/^[0-9]+$/, 'La referencia solo puede contener números.'),
  documentNumber: z
    .string()
    .min(6, 'El documento debe tener al menos 6 dígitos.')
    .regex(/^[0-9]+$/, 'El documento solo puede contener números.'),
  phone: z
    .string()
    .refine(
      (phone) => {
        const numericPhone = phone.replace(/\D/g, '');
        return numericPhone.length >= 10 && numericPhone.length <= 15;
      },
      { message: 'El número de teléfono debe tener entre 10 y 15 dígitos.' },
    ),
});

export type MembershipTransferPaymentData = z.infer<
  typeof MembershipTransferPaymentSchema
>;

export const MembershipPagoMovilPaymentSchema = MembershipPaymentSchema.extend({
  reference: z
    .string()
    .min(4, 'La referencia debe tener al menos 4 dígitos.')
    .regex(/^[0-9]+$/, 'La referencia solo puede contener números.'),
  documentNumber: z
    .string()
    .min(6, 'El documento debe tener al menos 6 dígitos.')
    .regex(/^[0-9]+$/, 'El documento solo puede contener números.'),
  phone: z
    .string()
    .refine(
      (phone) => {
        const numericPhone = phone.replace(/\D/g, '');
        return numericPhone.length >= 10 && numericPhone.length <= 15;
      },
      { message: 'El número de teléfono debe tener entre 10 y 15 dígitos.' },
    ),
});

export type MembershipPagoMovilPaymentData = z.infer<
  typeof MembershipPagoMovilPaymentSchema
>;
