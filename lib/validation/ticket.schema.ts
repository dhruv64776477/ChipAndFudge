import { z } from 'zod';

export const CreateTicketSchema = z.object({
  name: z.string().min(1, 'Customer name is required').max(60, 'Name is too long').trim(),
  mobNo: z
    .string()
    .min(5, 'Mobile number must be at least 5 digits')
    .max(15, 'Mobile number is too long')
    .regex(/^[+0-9\s-]+$/, 'Invalid characters in mobile number')
    .trim(),
});

export const TokenActionSchema = z.object({
  token: z.string().min(1, 'Token or Ticket ID is required').trim(),
});

export type CreateTicketSchemaType = z.infer<typeof CreateTicketSchema>;
export type TokenActionSchemaType = z.infer<typeof TokenActionSchema>;

