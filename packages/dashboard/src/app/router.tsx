import { Route, Switch } from "wouter";

import { LoginPage } from "./routes/login.tsx";
import { CreateProviderPage } from "./routes/providers/create.tsx";

export function AppRouter() {
	return (
		<Switch>
			<Route path="/login" component={LoginPage} />
			<Route path="/providers/new" component={CreateProviderPage} />
			<Route path="/">
				<div className="flex min-h-screen items-center justify-center bg-background text-foreground">
					<h1 className="text-2xl font-bold">Lancer Dashboard</h1>
				</div>
			</Route>
			<Route>
				<div className="flex min-h-screen items-center justify-center bg-background text-foreground">
					<h1 className="text-2xl font-bold">404 - Not Found</h1>
				</div>
			</Route>
		</Switch>
	);
}
