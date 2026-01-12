import { hash, verify } from "@node-rs/argon2";

export async function hashPassword(plaintext: string): Promise<string> {
	return hash(plaintext);
}

export async function verifyPassword(hashedPassword: string, plaintext: string): Promise<boolean> {
	return verify(hashedPassword, plaintext);
}
