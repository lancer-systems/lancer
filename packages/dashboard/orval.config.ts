import { join } from "node:path";
import { defineConfig } from "orval";

export default defineConfig({
	api: {
		input: join(import.meta.dirname, "../api/openapi.json"),
		output: {
			mode: "tags-split",
			target: join(import.meta.dirname, "src/lib/api/endpoints"),
			schemas: join(import.meta.dirname, "src/lib/api/model"),
			client: "swr",
			mock: true,
			override: {
				mutator: {
					path: join(import.meta.dirname, "src/lib/api-client.ts"),
					name: "customFetch",
				},
			},
		},
	},
});
