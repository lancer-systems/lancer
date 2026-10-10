import * as automation from "@pulumi/pulumi/automation/index.js";

type Stack = automation.Stack;
type OutputMap = automation.OutputMap;
const { LocalWorkspace } = automation;

export type PulumiBackend =
	| { type: "local"; path: string }
	| { type: "s3"; bucket: string; region: string };

function getBackendUrl(backend: PulumiBackend): string {
	switch (backend.type) {
		case "local":
			return `file://${backend.path}`;
		case "s3":
			return `s3://${backend.bucket}?region=${backend.region}`;
	}
}

export interface DeployResult {
	outputs: OutputMap;
	summary: {
		create: number;
		update: number;
		delete: number;
		same: number;
	};
}

export interface PulumiStackOptions {
	stackName: string;
	projectName: string;
	program: () => Promise<Record<string, unknown>>;
	backend: PulumiBackend;
	config?: Record<string, string>;
}

export async function getOrCreateStack(options: PulumiStackOptions): Promise<Stack> {
	const { stackName, projectName, program, backend, config } = options;

	const stack = await LocalWorkspace.createOrSelectStack(
		{
			stackName,
			projectName,
			program,
		},
		{
			projectSettings: {
				name: projectName,
				runtime: "nodejs",
				backend: {
					url: getBackendUrl(backend),
				},
			},
			envVars: {
				PULUMI_CONFIG_PASSPHRASE: "",
			},
		},
	);

	if (config) {
		for (const [key, value] of Object.entries(config)) {
			await stack.setConfig(key, { value });
		}
	}

	return stack;
}

export async function deployStack(
	stack: Stack,
	onOutput?: (message: string) => void,
): Promise<DeployResult> {
	const result = await stack.up({
		onOutput: onOutput || (() => {}),
	});

	return {
		outputs: result.outputs,
		summary: {
			create: result.summary.resourceChanges?.create || 0,
			update: result.summary.resourceChanges?.update || 0,
			delete: result.summary.resourceChanges?.delete || 0,
			same: result.summary.resourceChanges?.same || 0,
		},
	};
}

export interface PreviewResult {
	summary: {
		create: number;
		update: number;
		delete: number;
		same: number;
	};
}

export async function previewStack(
	stack: Stack,
	onOutput?: (message: string) => void,
): Promise<PreviewResult> {
	const result = await stack.preview({
		onOutput: onOutput || (() => {}),
	});

	return {
		summary: {
			create: result.changeSummary?.create || 0,
			update: result.changeSummary?.update || 0,
			delete: result.changeSummary?.delete || 0,
			same: result.changeSummary?.same || 0,
		},
	};
}
