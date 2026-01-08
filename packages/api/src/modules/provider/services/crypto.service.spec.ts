import { describe, expect, it } from "vitest";

import { decrypt, encrypt } from "./crypto.service.ts";

describe("Crypto Service", () => {
	describe("encrypt/decrypt", () => {
		it("should encrypt and decrypt a string correctly", () => {
			const plaintext = "my-secret-access-key-12345";

			const encrypted = encrypt(plaintext);
			const decrypted = decrypt(encrypted);

			expect(decrypted).toBe(plaintext);
		});

		it("should produce different ciphertexts for same plaintext", () => {
			const plaintext = "same-secret";

			const encrypted1 = encrypt(plaintext);
			const encrypted2 = encrypt(plaintext);

			expect(encrypted1.ciphertext).not.toBe(encrypted2.ciphertext);
			expect(encrypted1.iv).not.toBe(encrypted2.iv);
		});

		it("should produce different ciphertexts for different plaintexts", () => {
			const encrypted1 = encrypt("secret-one");
			const encrypted2 = encrypt("secret-two");

			expect(encrypted1.ciphertext).not.toBe(encrypted2.ciphertext);
		});

		it("should fail decryption with tampered ciphertext", () => {
			const encrypted = encrypt("original-secret");
			const tamperedCiphertext = Buffer.from(encrypted.ciphertext, "base64");

			tamperedCiphertext[0] ^= 0xff;

			expect(() =>
				decrypt({
					...encrypted,
					ciphertext: tamperedCiphertext.toString("base64"),
				}),
			).toThrow();
		});

		it("should fail decryption with tampered auth tag", () => {
			const encrypted = encrypt("original-secret");
			const tamperedTag = Buffer.from(encrypted.tag, "base64");

			tamperedTag[0] ^= 0xff;

			expect(() =>
				decrypt({
					...encrypted,
					tag: tamperedTag.toString("base64"),
				}),
			).toThrow();
		});

		it("should fail decryption with tampered IV", () => {
			const encrypted = encrypt("original-secret");
			const tamperedIv = Buffer.from(encrypted.iv, "base64");

			tamperedIv[0] ^= 0xff;

			expect(() =>
				decrypt({
					...encrypted,
					iv: tamperedIv.toString("base64"),
				}),
			).toThrow();
		});

		it("should handle empty string", () => {
			const plaintext = "";

			const encrypted = encrypt(plaintext);
			const decrypted = decrypt(encrypted);

			expect(decrypted).toBe(plaintext);
		});

		it("should handle unicode characters", () => {
			const plaintext = "émoji 🔐 日本語";

			const encrypted = encrypt(plaintext);
			const decrypted = decrypt(encrypted);

			expect(decrypted).toBe(plaintext);
		});
	});
});
