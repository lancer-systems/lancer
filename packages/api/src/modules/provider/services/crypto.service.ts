import { type CipherGCMTypes, createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

import { getEncryptionKey } from "../../common/services/secrets.service.ts";

const ALGORITHM: CipherGCMTypes = "aes-256-gcm";
const IV_LENGTH = 12;

export interface EncryptedData {
	ciphertext: string;
	iv: string;
	tag: string;
}

export function encrypt(plaintext: string): EncryptedData {
	const encryptionKey = getEncryptionKey();
	const iv = randomBytes(IV_LENGTH);
	const cipher = createCipheriv(ALGORITHM, encryptionKey, iv);

	let ciphertext = cipher.update(plaintext, "utf8", "base64");
	ciphertext += cipher.final("base64");

	return {
		ciphertext,
		iv: iv.toString("base64"),
		tag: cipher.getAuthTag().toString("base64"),
	};
}

export function decrypt(data: EncryptedData): string {
	const encryptionKey = getEncryptionKey();
	const decipher = createDecipheriv(ALGORITHM, encryptionKey, Buffer.from(data.iv, "base64"));

	decipher.setAuthTag(Buffer.from(data.tag, "base64"));

	let plaintext = decipher.update(data.ciphertext, "base64", "utf8");
	plaintext += decipher.final("utf8");

	return plaintext;
}
