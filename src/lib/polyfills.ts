import * as Crypto from 'expo-crypto'

const g: any = globalThis
if (!g.crypto) g.crypto = {}
if (!g.crypto.getRandomValues) {
  g.crypto.getRandomValues = (arr: any) => Crypto.getRandomValues(arr)
}
if (!g.crypto.subtle) {
  g.crypto.subtle = {
    digest: (_algo: string, data: ArrayBuffer | ArrayBufferView) =>
      Crypto.digest(Crypto.CryptoDigestAlgorithm.SHA256, data as any),
  }
}