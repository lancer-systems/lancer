import { RootProvider } from "fumadocs-ui/provider";
import type { ReactNode } from "react";

import "./global.css";

export const metadata = {
	title: {
		default: "Lancer",
		template: "%s | Lancer",
	},
	description: "A self-hosted deployment platform for your cloud provider",
};

export default function RootLayout({ children }: { children: ReactNode }) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body>
				<RootProvider>{children}</RootProvider>
			</body>
		</html>
	);
}
