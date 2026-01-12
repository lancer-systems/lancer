import * as p from "@clack/prompts";
import pc from "picocolors";

export { p };

export const colors = {
	// Semantic colors
	success: pc.green,
	error: pc.red,
	warning: pc.yellow,
	info: pc.blue,
	// Raw colors
	green: pc.green,
	yellow: pc.yellow,
	red: pc.red,
	cyan: pc.cyan,
	// Modifiers
	dim: pc.dim,
	bold: pc.bold,
};

export function intro(message: string): void {
	p.intro(pc.bgCyan(pc.black(` ${message} `)));
}

export function outro(message: string): void {
	p.outro(pc.green(message));
}

export function success(message: string): void {
	p.log.success(pc.green(message));
}

export function error(message: string): void {
	p.log.error(pc.red(message));
}

export function warning(message: string): void {
	p.log.warning(pc.yellow(message));
}

export function info(message: string): void {
	p.log.info(message);
}

export function step(message: string): void {
	p.log.step(message);
}

export function spinner(): ReturnType<typeof p.spinner> {
	return p.spinner();
}

export async function confirm(message: string): Promise<boolean> {
	const result = await p.confirm({ message });

	if (p.isCancel(result)) {
		p.cancel("Installation cancelled.");
		process.exit(0);
	}

	return result;
}

export async function text(options: {
	message: string;
	placeholder?: string;
	defaultValue?: string;
	validate?: (value: string) => string | undefined;
}): Promise<string> {
	const result = await p.text(options);

	if (p.isCancel(result)) {
		p.cancel("Installation cancelled.");
		process.exit(0);
	}

	return result;
}

export async function password(options: {
	message: string;
	validate?: (value: string) => string | undefined;
}): Promise<string> {
	const result = await p.password(options);

	if (p.isCancel(result)) {
		p.cancel("Installation cancelled.");
		process.exit(0);
	}

	return result;
}

export async function select<Value>(options: {
	message: string;
	options: Array<{ value: Value; label: string; hint?: string }>;
}): Promise<Value> {
	// @ts-expect-error - clack types are stricter than needed
	const result = await p.select(options);

	if (p.isCancel(result)) {
		p.cancel("Installation cancelled.");
		process.exit(0);
	}

	return result as Value;
}
