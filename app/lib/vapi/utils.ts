import { MessageType } from '@/types/vapi';

export function isFunctionCall(message: any) {
  return message?.type === MessageType.FUNCTION_CALL;
}
