import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";

import type { FoundationConfig, FoundationOutputs } from "../../types/index.ts";
import { foundationNames } from "../../utils/naming.ts";
import { foundationTags, mergeTags } from "../../utils/tags.ts";

// Create foundation infrastructure: VPC, ALB, ECS Cluster
export function createFoundation(_config: FoundationConfig): FoundationOutputs {
	const tags = foundationTags();

	// Create VPC with 2 public subnets (required for ALB)
	const vpc = new awsx.ec2.Vpc(foundationNames.vpc, {
		cidrBlock: "10.0.0.0/16",
		numberOfAvailabilityZones: 2,
		natGateways: {
			strategy: awsx.ec2.NatGatewayStrategy.None, // No NAT Gateway to save cost
		},
		subnetSpecs: [
			{
				type: awsx.ec2.SubnetType.Public,
				cidrMask: 24,
			},
		],
		tags: mergeTags(tags, { Name: foundationNames.vpc }),
	});

	// Create security group for ALB
	const albSecurityGroup = new aws.ec2.SecurityGroup(foundationNames.albSecurityGroup, {
		vpcId: vpc.vpcId,
		description: "Security group for Lancer ALB",
		ingress: [
			{
				description: "HTTP",
				fromPort: 80,
				toPort: 80,
				protocol: "tcp",
				cidrBlocks: ["0.0.0.0/0"],
			},
			{
				description: "HTTPS",
				fromPort: 443,
				toPort: 443,
				protocol: "tcp",
				cidrBlocks: ["0.0.0.0/0"],
			},
		],
		egress: [
			{
				description: "Allow all outbound",
				fromPort: 0,
				toPort: 0,
				protocol: "-1",
				cidrBlocks: ["0.0.0.0/0"],
			},
		],
		tags: mergeTags(tags, { Name: foundationNames.albSecurityGroup }),
	});

	// Create Application Load Balancer
	const alb = new aws.lb.LoadBalancer(foundationNames.alb, {
		internal: false,
		loadBalancerType: "application",
		securityGroups: [albSecurityGroup.id],
		subnets: vpc.publicSubnetIds,
		tags: mergeTags(tags, { Name: foundationNames.alb }),
	});

	// Create HTTP listener with default action (returns 404)
	// Services will add their own listener rules
	// HTTPS listener will be created when a service with custom domain is added
	const httpListener = new aws.lb.Listener(`${foundationNames.alb}-http`, {
		loadBalancerArn: alb.arn,
		port: 80,
		protocol: "HTTP",
		defaultActions: [
			{
				type: "fixed-response",
				fixedResponse: {
					contentType: "text/plain",
					messageBody: "No service configured",
					statusCode: "404",
				},
			},
		],
		tags: mergeTags(tags, { Name: `${foundationNames.alb}-http` }),
	});

	// Create security group for ECS instances
	const ecsSecurityGroup = new aws.ec2.SecurityGroup(foundationNames.ecsSecurityGroup, {
		vpcId: vpc.vpcId,
		description: "Security group for Lancer ECS instances",
		ingress: [
			{
				description: "Allow traffic from ALB",
				fromPort: 0,
				toPort: 65535,
				protocol: "tcp",
				securityGroups: [albSecurityGroup.id],
			},
		],
		egress: [
			{
				description: "Allow all outbound",
				fromPort: 0,
				toPort: 0,
				protocol: "-1",
				cidrBlocks: ["0.0.0.0/0"],
			},
		],
		tags: mergeTags(tags, { Name: foundationNames.ecsSecurityGroup }),
	});

	// Create ECS Cluster
	const cluster = new aws.ecs.Cluster(foundationNames.ecsCluster, {
		settings: [
			{
				name: "containerInsights",
				value: "disabled", // Disable to save cost for MVP
			},
		],
		tags: mergeTags(tags, { Name: foundationNames.ecsCluster }),
	});

	// Create IAM role for ECS instances
	const ecsInstanceRole = new aws.iam.Role(foundationNames.ecsInstanceRole, {
		assumeRolePolicy: JSON.stringify({
			Version: "2012-10-17",
			Statement: [
				{
					Action: "sts:AssumeRole",
					Effect: "Allow",
					Principal: {
						Service: "ec2.amazonaws.com",
					},
				},
			],
		}),
		tags: mergeTags(tags, { Name: foundationNames.ecsInstanceRole }),
	});

	// Attach ECS instance policy
	new aws.iam.RolePolicyAttachment(`${foundationNames.ecsInstanceRole}-ecs`, {
		role: ecsInstanceRole.name,
		policyArn: "arn:aws:iam::aws:policy/service-role/AmazonEC2ContainerServiceforEC2Role",
	});

	// Attach ECR read policy
	new aws.iam.RolePolicyAttachment(`${foundationNames.ecsInstanceRole}-ecr`, {
		role: ecsInstanceRole.name,
		policyArn: "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly",
	});

	// Allow EBS volume operations for persistent storage
	new aws.iam.RolePolicy(`${foundationNames.ecsInstanceRole}-ebs`, {
		role: ecsInstanceRole.name,
		policy: JSON.stringify({
			Version: "2012-10-17",
			Statement: [
				{
					Effect: "Allow",
					Action: [
						"ec2:AttachVolume",
						"ec2:DetachVolume",
						"ec2:DescribeVolumes",
						"ec2:DescribeVolumeStatus",
					],
					Resource: "*",
				},
			],
		}),
	});

	// Create instance profile with explicit name for consistency
	const ecsInstanceProfile = new aws.iam.InstanceProfile(foundationNames.ecsInstanceProfile, {
		name: foundationNames.ecsInstanceProfile,
		role: ecsInstanceRole.name,
		tags: mergeTags(tags, { Name: foundationNames.ecsInstanceProfile }),
	});

	return {
		vpcId: vpc.vpcId,
		subnetIds: vpc.publicSubnetIds,
		albArn: alb.arn,
		albDnsName: alb.dnsName,
		albListenerArn: httpListener.arn,
		ecsClusterArn: cluster.arn,
		ecsSecurityGroupId: ecsSecurityGroup.id,
		ecsInstanceProfileName: ecsInstanceProfile.name,
	};
}
