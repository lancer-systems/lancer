import * as ui from "../lib/ui.ts";

export interface AdminUser {
	email: string;
	password: string;
}

export async function collectAdminUser(): Promise<AdminUser> {
	ui.step("Admin Account");

	const email = await ui.text({
		message: "Admin email",
		placeholder: "admin@example.com",
		validate: (value) => {
			const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

			if (!emailRegex.test(value)) {
				return "Invalid email address";
			}

			return undefined;
		},
	});

	const password = await ui.password({
		message: "Admin password",
		validate: (value) => {
			if (value.length < 8) {
				return "Password must be at least 8 characters";
			}

			return undefined;
		},
	});

	return { email, password };
}
