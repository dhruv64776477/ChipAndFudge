import { z } from 'zod';
import { VALID_MENU_NAMES } from '@/lib/menu/items';

export const CreateTicketSchema = z.object({
  name: z.string().min(1, 'Customer name is required').max(60, 'Name is too long').trim(),
  mobNo: z
    .string()
    .trim()
    .regex(/^\d{10}$/, 'Mobile number must be exactly 10 digits'),
  orderItems: z
    .array(
      z.object({
        name: z
          .string()
          .refine((n) => VALID_MENU_NAMES.includes(n), {
            message: 'Invalid menu item name',
          }),
        quantity: z
          .number()
          .int('Quantity must be a whole number')
          .min(1, 'Quantity must be at least 1')
          .max(99, 'Quantity cannot exceed 99'),
      })
    )
    .min(1, 'At least one menu item is required'),
});

export const TokenActionSchema = z.object({
  token: z.string().min(1, 'Token or Ticket ID is required').trim(),
});

export type CreateTicketSchemaType = z.infer<typeof CreateTicketSchema>;
export type TokenActionSchemaType = z.infer<typeof TokenActionSchema>;
