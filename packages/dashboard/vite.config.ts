import { join } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
	plugins: [react(), tailwindcss()],
	server: {
		proxy: {
			"/api": {
				target: "http://localhost:3141",
				changeOrigin: true,
			},
		},
	},
	build: {
		outDir: join(import.meta.dirname, "../api/public"),
		emptyOutDir: true,
	},
});
