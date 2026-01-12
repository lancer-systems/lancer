export interface BootstrapResponse {
	user: {
		id: string;
		email: string;
	};
	provider: {
		id: string;
		name: string;
	};
}
