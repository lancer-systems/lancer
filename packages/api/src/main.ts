import { app } from "~/modules/app.module";

const PORT = Number(process.env.PORT) || 3141;
const HOST = process.env.HOST || "0.0.0.0";

app.listen({ port: PORT, host: HOST }, (error, address) => {
	if (error) {
		app.log.error(error);
		process.exit(1);
	}
	app.log.info(`Server listening at ${address}`);
});
