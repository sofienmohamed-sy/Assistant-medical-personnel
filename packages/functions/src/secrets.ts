import { defineSecret } from 'firebase-functions/params';

export const STRIPE_API_KEY = defineSecret('STRIPE_API_KEY');
