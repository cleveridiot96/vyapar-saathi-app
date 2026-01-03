
"use client";

// --- Key Derivation (Password to Key) ---

async function getKeyMaterial(password: string): Promise<CryptoKey> {
    const enc = new TextEncoder();
    return window.crypto.subtle.importKey(
        'raw',
        enc.encode(password),
        { name: 'PBKDF2' },
        false,
        ['deriveBits', 'deriveKey']
    );
}

export async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const keyMaterial = await getKeyMaterial(password);
    return window.crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: salt,
            iterations: 100000,
            hash: 'SHA-256',
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
    );
}

// --- Encryption and Decryption ---

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

    // Combine IV and encrypted data for storage.
    const fullMessage = new Uint8Array(iv.length + encryptedContent.byteLength);
    fullMessage.set(iv);
    fullMessage.set(new Uint8Array(encryptedContent), iv.length);

    // Return as a Base64 string for easy storage in Dexie
    return btoa(String.fromCharCode.apply(null, Array.from(fullMessage)));
}

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
        throw new Error("Failed to decrypt data. The password may be incorrect or the data corrupted.");
    }
}
