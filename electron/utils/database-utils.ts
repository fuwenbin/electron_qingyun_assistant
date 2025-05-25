export function generateTextID() {
  return crypto.randomUUID().replaceAll('-', '')
}