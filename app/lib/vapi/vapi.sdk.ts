import Vapi from '@vapi-ai/web';

import { envConfig } from '@/app/config/envConfig.client';

export const vapi = new Vapi(envConfig.vapi.publicKey);
