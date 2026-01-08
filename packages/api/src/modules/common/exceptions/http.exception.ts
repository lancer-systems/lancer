import type { FastifyError } from "fastify";

export class HttpException extends Error implements FastifyError {
	public readonly code: string;
	public readonly statusCode: number;

	constructor(statusCode: number, message: string) {
		super(message);

		this.statusCode = statusCode;
		this.name = this.constructor.name;
		this.code = `HTTP_${statusCode}`;
	}
}

export class BadRequestException extends HttpException {
	constructor(message = "Bad Request") {
		super(400, message);
	}
}

export class UnauthorizedException extends HttpException {
	constructor(message = "Unauthorized") {
		super(401, message);
	}
}

export class ForbiddenException extends HttpException {
	constructor(message = "Forbidden") {
		super(403, message);
	}
}

export class NotFoundException extends HttpException {
	constructor(message = "Not Found") {
		super(404, message);
	}
}

export class ConflictException extends HttpException {
	constructor(message = "Conflict") {
		super(409, message);
	}
}

export class InternalServerErrorException extends HttpException {
	constructor(message = "Internal Server Error") {
		super(500, message);
	}
}
