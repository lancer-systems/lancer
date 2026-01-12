import { randomBytes } from "node:crypto";
import { faker } from "@faker-js/faker";

import type { BootstrapRequest } from "../dtos/bootstrap.request.ts";

export function makeBootstrapRequest(overrides?: Partial<BootstrapRequest>): BootstrapRequest {
	return {
		admin: {
			email: faker.internet.email(),
			password: faker.internet.password({ length: 12, memorable: true }),
			...overrides?.admin,
		},
		provider: {
			name: faker.word.noun(),
			region: faker.helpers.arrayElement(["us-east-1", "eu-west-1", "ap-northeast-1"]),
			accessKeyId: `AKIA${faker.string.alphanumeric(16).toUpperCase()}`,
			secretAccessKey: randomBytes(30).toString("base64"),
			...overrides?.provider,
		},
	};
}
