import { z } from 'zod';

export const notifySchema = z.object({
  body: z.object({
    ticketId: z.string({
      required_error: 'ticketId is required',
    }),
    newState: z.string({
      required_error: 'newState is required',
    }),
    message: z.string({
      required_error: 'message is required',
    }),
  }),
});
