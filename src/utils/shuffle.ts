// Детерминированный 32-битный хеш (FNV-1a)
export function hash32(str: string): number {
  let h = 0x811c9dc5; // offset basis
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = (h >>> 0) * 0x01000193; // FNV prime
  }
  // приводим к беззнаковому 32-бит
  return h >>> 0;
}

export function computeShuffleKey(productId: string, salt: string): number {
  return hash32(`${salt}:${productId}`);
}