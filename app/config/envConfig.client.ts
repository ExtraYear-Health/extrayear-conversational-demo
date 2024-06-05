/** This config is exposed to the client side! */
export const envConfig = {
  enableMockups: process.env.NEXT_PUBLIC_ENABLE_MOCKUPS === 'true',
  vapi: {
    publicKey: process.env.NEXT_PUBLIC_VAPI_WEB_API_KEY,
  },
};
