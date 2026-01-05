import tsconfigPaths from "vite-tsconfig-paths";
import { defineProject } from "vitest/config";

export default defineProject({
	plugins: [tsconfigPaths()],
	test: {
		name: "api",
		globals: true,
		environment: "node",
		logHeapUsage: true,
		include: ["src/**/*.spec.ts"],
		exclude: ["**/node_modules/**", "**/dist/**"],
	},
});
