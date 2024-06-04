import Vapi from '@vapi-ai/web';

import { envConfig } from '@/app/config/envConfig';

export const vapi = new Vapi(envConfig.vapi.token);
