import { Assistant } from '@vapi-ai/web/dist/api';
import { Client, Dispatcher } from 'undici';

const privateToken = process.env.VAPI_PRIVATE_API_KEY;

const client = new Client('https://api.vapi.ai');

class VapiClient {
  client: Client;
  privateToken: string;

  constructor() {
    this.client = client;
    this.privateToken = privateToken;
  }

  async request<T>({ path, method = 'GET', headers, ...options }: Dispatcher.RequestOptions) {
    const response = await client.request({
      path,
      method,
      ...options,
      headers: { ...headers, Authorization: `Bearer ${this.privateToken}` },
    });

    return (await response.body.json()) as T;
  }

  async getAssistants() {
    const response = await this.request<Assistant[]>({
      method: 'GET',
      path: '/assistant',
    });

    return response;
  }

  async getAssistant(id: string) {
    const response = await this.request<Assistant>({
      method: 'GET',
      path: `/assistant/${id}`,
    });

    return response;
  }
}

export default new VapiClient();
