import { z } from 'zod';

export const googleLoginSchema = z.object({
  body: z.object({
    credential: z.string().min(1, 'credential is required'),
  }),
});
