import { stripVTControlCharacters } from "node:util";

import type { AwsCredentials, CallerIdentity } from "../../utils/aws-credentials.ts";
import {
	deployStack,
	getOrCreateStack,
	type PulumiBackend,
	previewStack,
} from "../../utils/pulumi-automation.ts";
import { createFoundation } from "./foundation.ts";
import { createWebService } from "./web-service.ts";

const LANCER_GIT_URL = "https://github.com/lancer-systems/lancer";
const LANCER_GIT_BRANCH = "main";

// Strip ANSI codes and newlines to prevent spinner display issues
function cleanProgressMessage(message: string): string {
	return stripVTControlCharacters(message)
		.replace(/[\r\n]+/g, " ") // Replace newlines with space
		.trim();
}

export interface DeployLancerConfig {
	credentials: AwsCredentials;
	identity: CallerIdentity;
	bootstrapToken: string;
	backend: PulumiBackend;
	onProgress?: (message: string) => void;
}

export interface DeployLancerResult {
	albDnsName: string;
}

export interface PreviewLancerResult {
	summary: {
		foundation: { create: number; update: number; delete: number; same: number };
		api: { create: number; update: number; delete: number; same: number };
	};
}

export async function deployLancer(config: DeployLancerConfig): Promise<DeployLancerResult> {
	const { credentials, identity, bootstrapToken, backend, onProgress } = config;

	// Set AWS credentials for Pulumi
	process.env.AWS_ACCESS_KEY_ID = credentials.accessKeyId;
	process.env.AWS_SECRET_ACCESS_KEY = credentials.secretAccessKey;
	process.env.AWS_REGION = credentials.region;

	// Deploy foundation first
	onProgress?.("Creating VPC and ALB...");

	const foundationProgram = async () => {
		const outputs = createFoundation({ region: credentials.region });
		return {
			vpcId: outputs.vpcId,
			subnetIds: outputs.subnetIds,
			albArn: outputs.albArn,
			albDnsName: outputs.albDnsName,
			albListenerArn: outputs.albListenerArn,
			ecsClusterArn: outputs.ecsClusterArn,
			ecsSecurityGroupId: outputs.ecsSecurityGroupId,
			ecsInstanceProfileName: outputs.ecsInstanceProfileName,
		};
	};

	const foundationStack = await getOrCreateStack({
		stackName: "foundation",
		projectName: "lancer",
		program: foundationProgram,
		backend,
		config: {
			"aws:region": credentials.region,
		},
	});

	const foundationResult = await deployStack(foundationStack, (message) => {
		const clean = cleanProgressMessage(message);
		if (clean.includes("creating") || clean.includes("created")) {
			const resource = clean.match(/aws:[^:]+:(\w+)/)?.[1];
			if (resource) {
				onProgress?.(`Creating ${resource}...`);
			}
		}
	});

	const foundation = {
		vpcId: String(foundationResult.outputs.vpcId?.value || ""),
		subnetIds: foundationResult.outputs.subnetIds?.value as string[],
		albArn: String(foundationResult.outputs.albArn?.value || ""),
		albDnsName: String(foundationResult.outputs.albDnsName?.value || ""),
		albListenerArn: String(foundationResult.outputs.albListenerArn?.value || ""),
		ecsClusterArn: String(foundationResult.outputs.ecsClusterArn?.value || ""),
		ecsSecurityGroupId: String(foundationResult.outputs.ecsSecurityGroupId?.value || ""),
		ecsInstanceProfileName: String(foundationResult.outputs.ecsInstanceProfileName?.value || ""),
	};

	// Deploy Lancer API using standard web service flow
	onProgress?.("Creating Lancer API service...");

	const apiProgram = async () => {
		const outputs = createWebService({
			name: "lancer-api",
			size: "micro",
			gitUrl: LANCER_GIT_URL,
			gitBranch: LANCER_GIT_BRANCH,
			buildCommand: "pnpm install && pnpm --filter @lancer/api build",
			startCommand: "node packages/api/dist/main.js",
			port: 3141,
			vpcId: foundation.vpcId,
			subnetIds: foundation.subnetIds,
			albListenerArn: foundation.albListenerArn,
			ecsClusterArn: foundation.ecsClusterArn,
			ecsSecurityGroupId: foundation.ecsSecurityGroupId,
			ecsInstanceProfileName: foundation.ecsInstanceProfileName,
			accountId: identity.accountId,
			region: credentials.region,
			environment: {
				LANCER_BOOTSTRAP_TOKEN: bootstrapToken,
			},
			ebsVolume: {
				size: 10,
				containerPath: "/app/packages/api/data",
			},
			healthCheckPath: "/api/health",
		});

		return {
			serviceArn: outputs.serviceArn,
			ecrRepositoryUrl: outputs.ecrRepositoryUrl,
			albDnsName: foundation.albDnsName,
		};
	};

	const apiStack = await getOrCreateStack({
		stackName: "lancer-api",
		projectName: "lancer",
		program: apiProgram,
		backend,
		config: {
			"aws:region": credentials.region,
		},
	});

	await deployStack(apiStack, (message) => {
		const clean = cleanProgressMessage(message);
		if (clean.includes("creating") || clean.includes("created")) {
			const resource = clean.match(/aws:[^:]+:(\w+)/)?.[1];
			if (resource) {
				onProgress?.(`Creating ${resource}...`);
			}
		}
	});

	return {
		albDnsName: foundation.albDnsName,
	};
}

export async function previewLancer(config: DeployLancerConfig): Promise<PreviewLancerResult> {
	const { credentials, identity, bootstrapToken, backend, onProgress } = config;

	// Set AWS credentials for Pulumi
	process.env.AWS_ACCESS_KEY_ID = credentials.accessKeyId;
	process.env.AWS_SECRET_ACCESS_KEY = credentials.secretAccessKey;
	process.env.AWS_REGION = credentials.region;

	// Preview foundation
	onProgress?.("Analyzing foundation changes...");

	const foundationProgram = async () => {
		const outputs = createFoundation({ region: credentials.region });
		return {
			vpcId: outputs.vpcId,
			subnetIds: outputs.subnetIds,
			albArn: outputs.albArn,
			albDnsName: outputs.albDnsName,
			albListenerArn: outputs.albListenerArn,
			ecsClusterArn: outputs.ecsClusterArn,
			ecsSecurityGroupId: outputs.ecsSecurityGroupId,
			ecsInstanceProfileName: outputs.ecsInstanceProfileName,
		};
	};

	const foundationStack = await getOrCreateStack({
		stackName: "foundation",
		projectName: "lancer",
		program: foundationProgram,
		backend,
		config: {
			"aws:region": credentials.region,
		},
	});

	const foundationPreview = await previewStack(foundationStack, (message) => {
		const clean = cleanProgressMessage(message);
		if (clean.includes("+") || clean.includes("~") || clean.includes("-")) {
			onProgress?.(`Foundation: ${clean}`);
		}
	});

	// Preview API service
	onProgress?.("Analyzing API service changes...");

	// Use placeholder values with valid ARN format for preview
	// These need proper ARN structure to pass provider validation
	// Note: We skip ebsVolume in preview because it triggers aws.ec2.getSubnet() which fails with placeholder IDs
	const { region } = credentials;
	const { accountId } = identity;
	const apiProgram = async () => {
		const outputs = createWebService({
			name: "lancer-api",
			size: "micro",
			gitUrl: LANCER_GIT_URL,
			gitBranch: LANCER_GIT_BRANCH,
			buildCommand: "pnpm install && pnpm --filter @lancer/api build",
			startCommand: "node packages/api/dist/main.js",
			port: 3141,
			vpcId: "vpc-00000000000000000",
			subnetIds: ["subnet-00000000000000001", "subnet-00000000000000002"],
			albListenerArn: `arn:aws:elasticloadbalancing:${region}:${accountId}:listener/app/preview/0000000000000000/0000000000000000`,
			ecsClusterArn: `arn:aws:ecs:${region}:${accountId}:cluster/preview`,
			ecsSecurityGroupId: "sg-00000000000000000",
			ecsInstanceProfileName: "lancer-ecs-instance-profile",
			accountId,
			region,
			environment: {
				LANCER_BOOTSTRAP_TOKEN: bootstrapToken,
			},
			// Skip ebsVolume for preview - it triggers aws.ec2.getSubnet() which fails with placeholder subnet IDs
			healthCheckPath: "/api/health",
		});

		return {
			serviceArn: outputs.serviceArn,
			ecrRepositoryUrl: outputs.ecrRepositoryUrl,
		};
	};

	const apiStack = await getOrCreateStack({
		stackName: "lancer-api",
		projectName: "lancer",
		program: apiProgram,
		backend,
		config: {
			"aws:region": credentials.region,
		},
	});

	const apiPreview = await previewStack(apiStack, (message) => {
		const clean = cleanProgressMessage(message);
		if (clean.includes("+") || clean.includes("~") || clean.includes("-")) {
			onProgress?.(`API: ${clean}`);
		}
	});

	return {
		summary: {
			foundation: foundationPreview.summary,
			api: apiPreview.summary,
		},
	};
}
