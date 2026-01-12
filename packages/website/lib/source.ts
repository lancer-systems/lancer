import { loader } from "fumadocs-core/source";

import { docs } from "../.source";

// docs is { docs: DocOut[], meta: MetaOut[], toFumadocsSource: () => Source }
// We need to create a source with files array for the loader

export const source = loader({
	baseUrl: "/docs",
	source: {
		files: [
			...docs.docs.map((doc) => ({
				type: "page" as const,
				path: doc._file.path,
				data: doc,
			})),
			...docs.meta.map((meta) => ({
				type: "meta" as const,
				path: meta._file.path,
				data: meta,
			})),
		],
	},
});
