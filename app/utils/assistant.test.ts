import { cleanName, grabId } from './assistant';

describe('assistant-name', () => {
  describe('grabId', () => {
    it('should extract IDs between brackets from a given assistant name', () => {
      const assistantName = '[cat:game][t:michael] Putting tasks in sequence';

      const therapistId = grabId(assistantName, 't');
      const gameId = grabId(assistantName, 'cat');

      expect(therapistId).toBe('michael');
      expect(gameId).toBe('game');
    });
  });

  describe('cleanName', () => {
    it('should remove any content within square brackets including the brackets themselves', () => {
      const assistantName = '[cat:game][t:michael] Putting tasks in sequence';

      const cleanedName = cleanName(assistantName);

      expect(cleanedName).toBe('Putting tasks in sequence');
    });
  });
});
