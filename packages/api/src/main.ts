import { app } from "./modules/app.module.ts";

app.listen({ port: 3141, host: "0.0.0.0" }, (error, address) => {
	if (error) {
		app.log.error(error);
		process.exit(1);
	}
	app.log.info(`Server listening at ${address}`);
});
