import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";

import { generateBuildspec } from "../../templates/buildspec.ts";
import type { WebServiceConfig, WebServiceOutputs } from "../../types/index.ts";
import { serviceNames } from "../../utils/naming.ts";
import { mergeTags, serviceTags } from "../../utils/tags.ts";

// Instance type mapping
const INSTANCE_TYPES: Record<string, string> = {
	nano: "t4g.nano",
	micro: "t4g.micro",
	small: "t4g.small",
	medium: "t4g.medium",
	large: "t4g.large",
};

export interface WebServiceInfraConfig extends WebServiceConfig {
	// Foundation outputs (required for deployment)
	vpcId: string;
	subnetIds: string[];
	albListenerArn: string;
	ecsClusterArn: string;
	ecsSecurityGroupId: string;
	ecsInstanceProfileName: string;
	accountId: string;
	region: string;
}

// Create web service infrastructure
export function createWebService(config: WebServiceInfraConfig): WebServiceOutputs {
	const names = serviceNames(config.name);
	const tags = serviceTags(config.name, "web");
	const instanceType = INSTANCE_TYPES[config.size] || "t4g.micro";

	// Create ECR Repository
	const ecrRepository = new aws.ecr.Repository(names.ecrRepository, {
		name: names.ecrRepository,
		imageTagMutability: "MUTABLE",
		imageScanningConfiguration: {
			scanOnPush: false, // Disable to save cost
		},
		forceDelete: true, // Allow deletion even with images
		tags: mergeTags(tags, { Name: names.ecrRepository }),
	});

	// Create IAM role for ECS Task Execution
	const taskExecutionRole = new aws.iam.Role(`${config.name}-task-exec-role`, {
		assumeRolePolicy: JSON.stringify({
			Version: "2012-10-17",
			Statement: [
				{
					Action: "sts:AssumeRole",
					Effect: "Allow",
					Principal: {
						Service: "ecs-tasks.amazonaws.com",
					},
				},
			],
		}),
		tags: mergeTags(tags, { Name: `${config.name}-task-exec-role` }),
	});

	// Attach managed policies for task execution
	new aws.iam.RolePolicyAttachment(`${config.name}-task-exec-policy`, {
		role: taskExecutionRole.name,
		policyArn: "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy",
	});

	// Create IAM role for ECS Task (application permissions)
	const taskRole = new aws.iam.Role(`${config.name}-task-role`, {
		assumeRolePolicy: JSON.stringify({
			Version: "2012-10-17",
			Statement: [
				{
					Action: "sts:AssumeRole",
					Effect: "Allow",
					Principal: {
						Service: "ecs-tasks.amazonaws.com",
					},
				},
			],
		}),
		tags: mergeTags(tags, { Name: `${config.name}-task-role` }),
	});

	// Allow task to read SSM parameters for this service
	const _ssmPolicy = new aws.iam.RolePolicy(`${config.name}-ssm-policy`, {
		role: taskRole.name,
		policy: pulumi.interpolate`{
      "Version": "2012-10-17",
      "Statement": [
        {
          "Effect": "Allow",
          "Action": [
            "ssm:GetParameter",
            "ssm:GetParameters",
            "ssm:GetParametersByPath"
          ],
          "Resource": "arn:aws:ssm:${config.region}:${config.accountId}:parameter/lancer/${config.name}/*"
        }
      ]
    }`,
	});

	// Create EBS volume if configured
	let ebsVolume: aws.ebs.Volume | undefined;
	if (config.ebsVolume) {
		ebsVolume = new aws.ebs.Volume(`${config.name}-data`, {
			availabilityZone: pulumi.output(config.subnetIds[0]).apply(async (subnetId) => {
				const subnet = await aws.ec2.getSubnet({ id: subnetId });
				return subnet.availabilityZone;
			}),
			size: config.ebsVolume.size,
			type: "gp3",
			encrypted: true,
			tags: mergeTags(tags, { Name: `${config.name}-data` }),
		});
	}

	// Create Target Group for ALB
	const targetGroup = new aws.lb.TargetGroup(names.targetGroup, {
		port: config.port,
		protocol: "HTTP",
		vpcId: config.vpcId,
		targetType: "instance",
		healthCheck: {
			enabled: true,
			path: config.healthCheckPath ?? "/",
			protocol: "HTTP",
			healthyThreshold: 2,
			unhealthyThreshold: 3,
			timeout: 5,
			interval: 30,
			matcher: "200-399",
		},
		deregistrationDelay: 30,
		tags: mergeTags(tags, { Name: names.targetGroup }),
	});

	// Create ALB Listener Rule (host-based routing)
	// Priority is based on service name hash to avoid conflicts
	const priority = Math.abs(hashCode(config.name) % 50000) + 1;

	const _listenerRule = new aws.lb.ListenerRule(`${config.name}-rule`, {
		listenerArn: config.albListenerArn,
		priority,
		actions: [
			{
				type: "forward",
				targetGroupArn: targetGroup.arn,
			},
		],
		conditions: [
			{
				pathPattern: {
					values: ["/*"],
				},
			},
			// Match any host for now - will use path-based routing
			// Custom domains will add host-based rules later
		],
		tags: mergeTags(tags, { Name: `${config.name}-rule` }),
	});

	// Get the latest ECS-optimized AMI for ARM64
	const ecsAmi = aws.ssm.getParameterOutput({
		name: "/aws/service/ecs/optimized-ami/amazon-linux-2023/arm64/recommended/image_id",
	});

	// Create Launch Template
	const launchTemplate = new aws.ec2.LaunchTemplate(names.launchTemplate, {
		namePrefix: `${names.launchTemplate}-`,
		imageId: ecsAmi.value,
		instanceType,
		iamInstanceProfile: {
			name: config.ecsInstanceProfileName,
		},
		vpcSecurityGroupIds: [config.ecsSecurityGroupId],
		userData: pulumi.all([config.ecsClusterArn, ebsVolume?.id]).apply(([clusterArn, volumeId]) => {
			const clusterName = clusterArn.split("/").pop() || "";
			let script = `#!/bin/bash
echo ECS_CLUSTER=${clusterName} >> /etc/ecs/ecs.config
echo ECS_ENABLE_CONTAINER_METADATA=true >> /etc/ecs/ecs.config
`;
			if (volumeId) {
				script += `
# Mount EBS volume
INSTANCE_ID=$(curl -s http://169.254.169.254/latest/meta-data/instance-id)
REGION=$(curl -s http://169.254.169.254/latest/meta-data/placement/region)
DEVICE=/dev/xvdf
MOUNT_POINT=/data

# Wait for volume to be available
aws ec2 wait volume-available --volume-ids ${volumeId} --region $REGION || true

# Attach volume
aws ec2 attach-volume --volume-id ${volumeId} --instance-id $INSTANCE_ID --device $DEVICE --region $REGION

# Wait for device to appear
while [ ! -e $DEVICE ]; do sleep 1; done

# Format if needed (only if no filesystem)
if ! blkid $DEVICE; then
  mkfs.ext4 $DEVICE
fi

# Mount
mkdir -p $MOUNT_POINT
mount $DEVICE $MOUNT_POINT
`;
			}
			return Buffer.from(script).toString("base64");
		}),
		tagSpecifications: [
			{
				resourceType: "instance",
				tags: mergeTags(tags, { Name: config.name }),
			},
		],
		tags: mergeTags(tags, { Name: names.launchTemplate }),
	});

	// Create Auto Scaling Group
	const _autoScalingGroup = new aws.autoscaling.Group(names.autoScalingGroup, {
		minSize: 1,
		maxSize: 1,
		desiredCapacity: 1,
		vpcZoneIdentifiers: config.subnetIds,
		launchTemplate: {
			id: launchTemplate.id,
			version: "$Latest",
		},
		targetGroupArns: [targetGroup.arn],
		healthCheckType: "ELB",
		healthCheckGracePeriod: 300,
		tags: [
			{ key: "Name", value: config.name, propagateAtLaunch: true },
			{ key: "lancer:managed", value: "true", propagateAtLaunch: true },
			{ key: "lancer:service", value: config.name, propagateAtLaunch: true },
			{ key: "lancer:type", value: "web", propagateAtLaunch: true },
		],
	});

	// Build environment variables
	const baseEnvironment = [
		{ name: "PORT", value: String(config.port) },
		{ name: "NODE_ENV", value: "production" },
	];
	const customEnvironment = Object.entries(config.environment ?? {}).map(([name, value]) => ({
		name,
		value,
	}));
	const environment = [...baseEnvironment, ...customEnvironment];

	// Build mount points and volumes
	const mountPoints = config.ebsVolume
		? [{ sourceVolume: `${config.name}-data`, containerPath: config.ebsVolume.containerPath }]
		: [];
	const volumes = config.ebsVolume ? [{ name: `${config.name}-data`, hostPath: "/data" }] : [];

	// Create ECS Task Definition
	const taskDefinition = new aws.ecs.TaskDefinition(names.taskDefinition, {
		family: names.taskDefinition,
		cpu: "256",
		memory: "512",
		networkMode: "bridge",
		executionRoleArn: taskExecutionRole.arn,
		taskRoleArn: taskRole.arn,
		containerDefinitions: pulumi.all([ecrRepository.repositoryUrl]).apply(([repoUrl]) =>
			JSON.stringify([
				{
					name: config.name,
					image: `${repoUrl}:latest`,
					essential: true,
					portMappings: [
						{
							containerPort: config.port,
							hostPort: 0, // Dynamic port mapping for bridge mode
							protocol: "tcp",
						},
					],
					logConfiguration: {
						logDriver: "awslogs",
						options: {
							"awslogs-group": `/ecs/${config.name}`,
							"awslogs-region": config.region,
							"awslogs-stream-prefix": "ecs",
							"awslogs-create-group": "true",
						},
					},
					environment,
					mountPoints,
				},
			]),
		),
		volumes,
		tags: mergeTags(tags, { Name: names.taskDefinition }),
	});

	// Create ECS Service
	const service = new aws.ecs.Service(names.service, {
		name: names.service,
		cluster: config.ecsClusterArn,
		taskDefinition: taskDefinition.arn,
		desiredCount: 1,
		launchType: "EC2",
		loadBalancers: [
			{
				targetGroupArn: targetGroup.arn,
				containerName: config.name,
				containerPort: config.port,
			},
		],
		orderedPlacementStrategies: [
			{
				type: "spread",
				field: "instanceId",
			},
		],
		tags: mergeTags(tags, { Name: names.service }),
	});

	// Create CloudWatch Log Group
	new aws.cloudwatch.LogGroup(`${config.name}-logs`, {
		name: `/ecs/${config.name}`,
		retentionInDays: 7, // Short retention to save cost
		tags: mergeTags(tags, { Name: `${config.name}-logs` }),
	});

	// Create CodeBuild IAM Role
	const codebuildRole = new aws.iam.Role(`${config.name}-codebuild-role`, {
		assumeRolePolicy: JSON.stringify({
			Version: "2012-10-17",
			Statement: [
				{
					Action: "sts:AssumeRole",
					Effect: "Allow",
					Principal: {
						Service: "codebuild.amazonaws.com",
					},
				},
			],
		}),
		tags: mergeTags(tags, { Name: `${config.name}-codebuild-role` }),
	});

	// CodeBuild policy
	const _codebuildPolicy = new aws.iam.RolePolicy(`${config.name}-codebuild-policy`, {
		role: codebuildRole.name,
		policy: pulumi.all([ecrRepository.arn, config.ecsClusterArn]).apply(([ecrArn, clusterArn]) =>
			JSON.stringify({
				Version: "2012-10-17",
				Statement: [
					{
						Effect: "Allow",
						Action: ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"],
						Resource: "*",
					},
					{
						Effect: "Allow",
						Action: ["ecr:GetAuthorizationToken"],
						Resource: "*",
					},
					{
						Effect: "Allow",
						Action: [
							"ecr:BatchCheckLayerAvailability",
							"ecr:GetDownloadUrlForLayer",
							"ecr:BatchGetImage",
							"ecr:PutImage",
							"ecr:InitiateLayerUpload",
							"ecr:UploadLayerPart",
							"ecr:CompleteLayerUpload",
						],
						Resource: ecrArn,
					},
					{
						Effect: "Allow",
						Action: ["ecs:UpdateService"],
						Resource: `${clusterArn.replace(":cluster/", ":service/")}/${names.service}`,
					},
					{
						Effect: "Allow",
						Action: ["ecs:DescribeServices"],
						Resource: "*",
					},
				],
			}),
		),
	});

	// Create CodeBuild Project
	const clusterName = pulumi
		.output(config.ecsClusterArn)
		.apply((arn) => arn.split("/").pop() || "");

	const _codebuildProject = new aws.codebuild.Project(`${config.name}-build`, {
		name: `lancer-${config.name}`,
		description: `Build project for ${config.name}`,
		serviceRole: codebuildRole.arn,
		artifacts: {
			type: "NO_ARTIFACTS",
		},
		environment: {
			computeType: "BUILD_GENERAL1_SMALL",
			image: "aws/codebuild/amazonlinux2-aarch64-standard:3.0",
			type: "ARM_CONTAINER",
			privilegedMode: true, // Required for Docker builds
		},
		source: {
			type: "GITHUB",
			location: config.gitUrl,
			gitCloneDepth: 1,
			buildspec: pulumi
				.all([ecrRepository.repositoryUrl, clusterName])
				.apply(([repoUrl, cluster]) =>
					generateBuildspec({
						serviceName: config.name,
						region: config.region,
						accountId: config.accountId,
						ecrRepositoryUrl: repoUrl,
						clusterName: cluster,
						buildCommand: config.buildCommand,
					}),
				),
		},
		sourceVersion: config.gitBranch,
		tags: mergeTags(tags, { Name: `${config.name}-build` }),
	});

	// Generate the service URL
	const url = pulumi.interpolate`http://${targetGroup.arn.apply(() => "alb-dns-name")}/${config.name}`;

	return {
		serviceArn: service.id,
		taskDefinitionArn: taskDefinition.arn,
		targetGroupArn: targetGroup.arn,
		ecrRepositoryUrl: ecrRepository.repositoryUrl,
		url,
	};
}

// Simple hash function for generating unique priorities
function hashCode(str: string): number {
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		const char = str.charCodeAt(i);
		hash = (hash << 5) - hash + char;
		hash = hash & hash; // Convert to 32bit integer
	}
	return hash;
}
