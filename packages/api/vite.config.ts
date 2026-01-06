import { defineConfig } from "vite";
import { VitePluginNode } from "vite-plugin-node";
import tsconfigPaths from "vite-tsconfig-paths";

const PORT = Number(process.env.PORT) || 3141;

export default defineConfig(({ command }) => ({
	server: {
		port: PORT,
	},
	plugins: [
		// VitePluginNode only for dev server
		...(command === "serve"
			? VitePluginNode({
					adapter: "fastify",
					appPath: "./src/modules/app.module.ts",
					exportName: "app",
					tsCompiler: "esbuild",
				})
			: []),
		tsconfigPaths(),
	],
	build: {
		outDir: "dist",
		target: "node22",
		ssr: true,
		rollupOptions: {
			input: "./src/main.ts",
			output: {
				format: "esm",
				entryFileNames: "[name].js",
				chunkFileNames: "[name].js",
				preserveModules: true,
				preserveModulesRoot: "src",
			},
			external: [
				/^node:/,
				"fastify",
				"fastify-type-provider-zod",
				"drizzle-orm",
				"drizzle-orm/better-sqlite3",
				"drizzle-orm/sqlite-core",
				"better-sqlite3",
				"nanoid",
				"zod",
				"@node-rs/argon2",
				"@fastify/cookie",
				"@fastify/jwt",
			],
		},
	},
}));
