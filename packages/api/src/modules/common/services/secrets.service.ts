import { randomBytes } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "../../../../data");
const SECRETS_PATH = join(DATA_DIR, ".secrets.json");

const secretsSchema = z.object({
	encryptionKey: z.string().min(1),
	jwtSecret: z.string().min(1),
});

type Secrets = z.infer<typeof secretsSchema>;

let cached: Secrets | null = null;

function generateSecrets(): Secrets {
	return {
		encryptionKey: randomBytes(32).toString("base64"),
		jwtSecret: randomBytes(64).toString("base64"),
	};
}

export function getSecrets(): Secrets {
	if (cached) {
		return cached;
	}

	if (existsSync(SECRETS_PATH)) {
		try {
			cached = secretsSchema.parse(JSON.parse(readFileSync(SECRETS_PATH, "utf-8")));

			return cached;
		} catch {
			// File corrupted or invalid, regenerate
		}
	}

	cached = generateSecrets();

	mkdirSync(DATA_DIR, { recursive: true });
	writeFileSync(SECRETS_PATH, JSON.stringify(cached, null, "\t"), { mode: 0o600 });

	return cached;
}

export function getEncryptionKey(): Buffer {
	return Buffer.from(getSecrets().encryptionKey, "base64");
}

export function getJwtSecret(): Uint8Array {
	return new TextEncoder().encode(getSecrets().jwtSecret);
}
