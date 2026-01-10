import { writeFile } from "node:fs/promises";
import { join } from "node:path";

import { app } from "../modules/app.module.ts";

(async function generateOpenApi() {
	await app.ready();

	const spec = app.swagger();
	const outputPath = join(import.meta.dirname, "../../openapi.json");

	await writeFile(outputPath, JSON.stringify(spec, null, 2));

	console.log(`OpenAPI spec written to ${outputPath}`);

	await app.close();
})();
