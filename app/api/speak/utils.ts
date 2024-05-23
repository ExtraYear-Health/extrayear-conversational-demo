/**
 * Make text speakable by replacing certain characters and patterns such as URLs
 */
export function makeTextSpeakable(text: string): string {
  return text
    .replaceAll('¡', '')
    // make links right for TTS
    .replaceAll('https://', '')
    .replaceAll('http://', '')
    .replaceAll('.com', ' dot com')
    .replaceAll('.org', ' dot org')
    .replaceAll('.co.uk', ' dot co dot UK')
    .replaceAll('.net', ' dot net')
    .replaceAll('.io', ' dot io')

    // remove markdown syntax
    .replace(/^#{1,6} /gm, '')
    .replace(/\*\*([^\*]+)\*\*/g, '$1') // bold
    .replace(/\*([^\*]+)\*/g, '$1') // italic
    .replace(/__([^_]+)__/g, '$1') // bold
    .replace(/_([^_]+)_/g, '$1') // italic
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // remove links

    .replaceAll(/```[\s\S]*?```/g, '\nAs shown on the app.\n')
    .replaceAll(
      /([a-zA-Z0-9])\/([a-zA-Z0-9])/g,
      (match, precedingText, followingText) => {
        return precedingText + ' forward slash ' + followingText;
      },
    );
}
