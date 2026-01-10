import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { SWRConfig } from "swr";

import { AppRouter } from "./app/router.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<SWRConfig
			value={{
				fetcher: (url: string) => fetch(url, { credentials: "include" }).then((res) => res.json()),
				revalidateOnFocus: false,
			}}
		>
			<AppRouter />
		</SWRConfig>
	</StrictMode>,
);
