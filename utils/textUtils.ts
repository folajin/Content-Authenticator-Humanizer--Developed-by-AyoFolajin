// A simple word-based chunking utility

export const countWords = (text: string): number => {
  if (!text.trim()) {
    return 0;
  }
  return text.trim().split(/\s+/).length;
};

export const chunkText = (text: string, chunkSizeInWords: number): string[] => {
  if (countWords(text) <= chunkSizeInWords) {
    return [text];
  }

  const words = text.split(/\s+/);
  const chunks: string[] = [];
  let currentChunk: string[] = [];

  for (const word of words) {
    currentChunk.push(word);
    if (currentChunk.length >= chunkSizeInWords) {
      chunks.push(currentChunk.join(' '));
      currentChunk = [];
    }
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join(' '));
  }

  return chunks;
};
