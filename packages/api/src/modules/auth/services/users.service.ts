import * as userAdapter from "../adapters/user.adapter.ts";
import * as passwordService from "./password.service.ts";

interface CreateUserRequest {
	email: string;
	password: string;
}

export async function createUser(request: CreateUserRequest) {
	return userAdapter.create({
		email: request.email,
		passwordHash: await passwordService.hashPassword(request.password),
	});
}
