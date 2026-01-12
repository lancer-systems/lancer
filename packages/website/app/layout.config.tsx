import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";

export const baseOptions: BaseLayoutProps = {
	nav: {
		title: "Lancer",
	},
	links: [
		{
			text: "Documentation",
			url: "/docs",
			active: "nested-url",
		},
		{
			text: "GitHub",
			url: "https://github.com/lancer-systems/lancer",
			external: true,
		},
	],
};
