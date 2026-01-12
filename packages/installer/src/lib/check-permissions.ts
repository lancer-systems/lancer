import { IAMClient, SimulatePrincipalPolicyCommand } from "@aws-sdk/client-iam";
import type { AwsCredentials } from "@lancer/infrastructure";

const REQUIRED_ACTIONS = [
	// S3 (state bucket)
	"s3:CreateBucket",
	"s3:PutBucketVersioning",
	// EC2/VPC
	"ec2:DescribeAvailabilityZones",
	"ec2:CreateVpc",
	"ec2:CreateSubnet",
	"ec2:CreateSecurityGroup",
	"ec2:CreateInternetGateway",
	"ec2:CreateRouteTable",
	"ec2:CreateRoute",
	"ec2:RunInstances",
	// ECS
	"ecs:CreateCluster",
	"ecs:CreateService",
	"ecs:RegisterTaskDefinition",
	// ALB
	"elasticloadbalancing:CreateLoadBalancer",
	"elasticloadbalancing:CreateTargetGroup",
	"elasticloadbalancing:CreateListener",
	// IAM
	"iam:CreateRole",
	"iam:CreateInstanceProfile",
	"iam:PassRole",
	// ECR
	"ecr:CreateRepository",
	// CodeBuild
	"codebuild:CreateProject",
];

export interface PermissionCheckResult {
	success: boolean;
	missingPermissions: string[];
	skipped: boolean;
}

export async function checkAwsPermissions(
	credentials: AwsCredentials,
	userArn: string,
): Promise<PermissionCheckResult> {
	const client = new IAMClient({
		region: credentials.region,
		credentials: {
			accessKeyId: credentials.accessKeyId,
			secretAccessKey: credentials.secretAccessKey,
		},
	});

	try {
		const result = await client.send(
			new SimulatePrincipalPolicyCommand({
				PolicySourceArn: userArn,
				ActionNames: REQUIRED_ACTIONS,
			}),
		);

		const denied =
			result.EvaluationResults?.filter((r) => r.EvalDecision !== "allowed")
				.map((r) => r.EvalActionName)
				.filter((name): name is string => name !== undefined) || [];

		return {
			success: denied.length === 0,
			missingPermissions: denied,
			skipped: false,
		};
	} catch (error) {
		// If SimulatePrincipalPolicy is not allowed, skip the check
		if (error instanceof Error && error.name === "AccessDenied") {
			return { success: true, missingPermissions: [], skipped: true };
		}
		throw error;
	}
}
