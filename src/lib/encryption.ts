
"use client";

// --- Part 1: Core Cryptography Functions ---
// These functions use the browser's built-in Web Crypto API.

/**
 * 1. Derives a secure encryption key from a user's password.
 * This is slow on purpose to make password guessing very difficult.
 * @param password The user's password.
 * @param salt A unique random value to prevent pre-computed attacks.
 */
export async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const baseKey = await window.crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000, // A standard number of rounds for security.
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: 256 }, // Specify the algorithm the key will be used for.
    true,
    ["encrypt", "decrypt"]
  );
}

/**
 * 2. Encrypts a piece of data (any JavaScript object).
 * @param data The object to encrypt.
 * @param key The encryption key from deriveKey().
 * @returns A string containing the encrypted data and the necessary initialization vector (iv).
 */
export async function encryptData(key: CryptoKey, data: any): Promise<string> {
    const iv = window.crypto.getRandomValues(new Uint8Array(12)); // 96-bits is recommended for GCM
    const enc = new TextEncoder();
    const encodedData = enc.encode(JSON.stringify(data));

    const encryptedContent = await window.crypto.subtle.encrypt(
        {
            name: 'AES-GCM',
            iv: iv,
        },
        key,
        encodedData
    );

    // Combine IV and encrypted data into a single array for storage.
    const fullMessage = new Uint8Array(iv.length + encryptedContent.byteLength);
    fullMessage.set(iv);
    fullMessage.set(new Uint8Array(encryptedContent), iv.length);

    // Return as a Base64 string for easy storage
    return btoa(String.fromCharCode.apply(null, Array.from(fullMessage)));
}


/**
 * 3. Decrypts a string of data back into its original JavaScript object.
 * @param encryptedBase64 The string from our encrypt() function.
 * @param key The encryption key.
 * @returns The original JavaScript object.
 */
export async function decryptData(key: CryptoKey, encryptedBase64: string): Promise<any> {
    try {
        const fullMessage = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));

        const iv = fullMessage.slice(0, 12);
        const encryptedContent = fullMessage.slice(12);

        const decryptedContent = await window.crypto.subtle.decrypt(
            {
                name: 'AES-GCM',
                iv: iv,
            },
            key,
            encryptedContent
        );

        const dec = new TextDecoder();
        const decryptedString = dec.decode(decryptedContent);
        return JSON.parse(decryptedString);
    } catch (error) {
        console.error("Decryption failed:", error);
        throw new Error("Failed to decrypt data. The password may be incorrect or the data is corrupted.");
    }
}
