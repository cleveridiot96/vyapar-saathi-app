
// A simple, insecure-but-functional hashing method for offline use.
// IMPORTANT: This is NOT for production use where data is transmitted over a network.
export async function createPasswordHash(password: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

export async function verifyPhoneNumber(phoneNumber: string, hashSet: string[]): Promise<boolean> {
    const inputHash = await createPasswordHash(phoneNumber);
    return hashSet.includes(inputHash);
}
