export function anonymizeResponse(response: string): string {
    return response.replace(/\b[A-Z][a-z]*\b/g, '').trim();
  }
  
  export function filterResponse(response: string): string {
    const blockedWords = ['damn', 'hell', 'adult', 'fuck', 'shit'];
    return blockedWords.some(word => response.toLowerCase().includes(word))
      ? 'Please keep responses appropriate! 😊 Try again.'
      : response;
  }