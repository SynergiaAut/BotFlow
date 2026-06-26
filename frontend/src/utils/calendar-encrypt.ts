import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.CALENDAR_ENCRYPTION_KEY;
const ALGORITHM = 'aes-256-gcm';

/**
 * Cifra un texto utilizando AES-256-GCM
 * Retorna un string formateado como "iv:textoCifrado:authTag" en formato hexadecimal
 */
export function encrypt(text: string): string {
    if (!ENCRYPTION_KEY) {
        throw new Error('CALENDAR_ENCRYPTION_KEY is not defined in environment variables');
    }
    
    const key = Buffer.from(ENCRYPTION_KEY, 'hex');
    if (key.length !== 32) {
        throw new Error('CALENDAR_ENCRYPTION_KEY must be a 32-byte hex string (64 characters)');
    }

    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag().toString('hex');
    
    return `${iv.toString('hex')}:${encrypted}:${authTag}`;
}

/**
 * Descifra un texto cifrado en formato "iv:textoCifrado:authTag" usando AES-256-GCM
 */
export function decrypt(encryptedText: string): string {
    if (!ENCRYPTION_KEY) {
        throw new Error('CALENDAR_ENCRYPTION_KEY is not defined in environment variables');
    }

    const key = Buffer.from(ENCRYPTION_KEY, 'hex');
    if (key.length !== 32) {
        throw new Error('CALENDAR_ENCRYPTION_KEY must be a 32-byte hex string (64 characters)');
    }

    const parts = encryptedText.split(':');
    if (parts.length !== 3) {
        throw new Error('Invalid encrypted text format');
    }

    const iv = Buffer.from(parts[0], 'hex');
    const encryptedData = Buffer.from(parts[1], 'hex');
    const authTag = Buffer.from(parts[2], 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedData);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted.toString('utf8');
}
