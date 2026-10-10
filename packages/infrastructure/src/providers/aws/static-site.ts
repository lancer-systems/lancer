import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";

import { generateStaticBuildspec } from "../../templates/buildspec-static.ts";
import type { StaticSiteConfig, StaticSiteOutputs } from "../../types/index.ts";
import { serviceNames } from "../../utils/naming.ts";
import { mergeTags, serviceTags } from "../../utils/tags.ts";

export interface StaticSiteInfraConfig extends StaticSiteConfig {
	accountId: string;
	region: string;
}

// Create static site infrastructure
export function createStaticSite(config: StaticSiteInfraConfig): StaticSiteOutputs {
	const names = serviceNames(config.name);
	const tags = serviceTags(config.name, "static");

	// Create S3 bucket for static content
	const bucket = new aws.s3.BucketV2(names.bucket, {
		bucket: `lancer-${config.name}-${config.accountId}`,
		tags: mergeTags(tags, { Name: names.bucket }),
	});

	// Block all public access
	new aws.s3.BucketPublicAccessBlock(`${config.name}-public-access-block`, {
		bucket: bucket.id,
		blockPublicAcls: true,
		blockPublicPolicy: true,
		ignorePublicAcls: true,
		restrictPublicBuckets: true,
	});

	// Create Origin Access Control for CloudFront
	const oac = new aws.cloudfront.OriginAccessControl(`${config.name}-oac`, {
		name: `lancer-${config.name}-oac`,
		description: `OAC for ${config.name}`,
		originAccessControlOriginType: "s3",
		signingBehavior: "always",
		signingProtocol: "sigv4",
	});

	// Create CloudFront Function for SPA routing
	const routingFunction = new aws.cloudfront.Function(`${config.name}-routing`, {
		name: `lancer-${config.name}-routing`,
		runtime: "cloudfront-js-2.0",
		publish: true,
		code: `
function handler(event) {
  var request = event.request;
  var uri = request.uri;

  // If the URI doesn't have an extension, serve index.html
  if (!uri.includes('.')) {
    request.uri = '/index.html';
  }

  return request;
}
`,
	});

	// Create CloudFront distribution
	const distribution = new aws.cloudfront.Distribution(names.distribution, {
		enabled: true,
		isIpv6Enabled: true,
		defaultRootObject: "index.html",
		comment: `Lancer static site: ${config.name}`,
		priceClass: "PriceClass_100", // Use only North America and Europe for lower cost
		origins: [
			{
				domainName: bucket.bucketRegionalDomainName,
				originId: "S3Origin",
				originAccessControlId: oac.id,
			},
		],
		defaultCacheBehavior: {
			targetOriginId: "S3Origin",
			viewerProtocolPolicy: "redirect-to-https",
			allowedMethods: ["GET", "HEAD", "OPTIONS"],
			cachedMethods: ["GET", "HEAD"],
			compress: true,
			cachePolicyId: "658327ea-f89d-4fab-a63d-7e88639e58f6", // CachingOptimized managed policy
			originRequestPolicyId: "88a5eaf4-2fd4-4709-b370-b4c650ea3fcf", // CORS-S3Origin managed policy
			functionAssociations: [
				{
					eventType: "viewer-request",
					functionArn: routingFunction.arn,
				},
			],
		},
		customErrorResponses: [
			{
				errorCode: 403,
				responseCode: 200,
				responsePagePath: "/index.html",
				errorCachingMinTtl: 10,
			},
			{
				errorCode: 404,
				responseCode: 200,
				responsePagePath: "/index.html",
				errorCachingMinTtl: 10,
			},
		],
		restrictions: {
			geoRestriction: {
				restrictionType: "none",
			},
		},
		viewerCertificate: {
			cloudfrontDefaultCertificate: true,
		},
		tags: mergeTags(tags, { Name: names.distribution }),
	});

	// Create bucket policy to allow CloudFront access
	new aws.s3.BucketPolicy(`${config.name}-bucket-policy`, {
		bucket: bucket.id,
		policy: pulumi.all([bucket.arn, distribution.arn]).apply(([bucketArn, distributionArn]) =>
			JSON.stringify({
				Version: "2012-10-17",
				Statement: [
					{
						Sid: "AllowCloudFrontServicePrincipal",
						Effect: "Allow",
						Principal: {
							Service: "cloudfront.amazonaws.com",
						},
						Action: "s3:GetObject",
						Resource: `${bucketArn}/*`,
						Condition: {
							StringEquals: {
								"AWS:SourceArn": distributionArn,
							},
						},
					},
				],
			}),
		),
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
		policy: pulumi.all([bucket.arn, distribution.id]).apply(([bucketArn, distId]) =>
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
						Action: ["s3:PutObject", "s3:GetObject", "s3:DeleteObject", "s3:ListBucket"],
						Resource: [bucketArn, `${bucketArn}/*`],
					},
					{
						Effect: "Allow",
						Action: ["cloudfront:CreateInvalidation"],
						Resource: `arn:aws:cloudfront::${config.accountId}:distribution/${distId}`,
					},
				],
			}),
		),
	});

	// Create CodeBuild Project
	const _codebuildProject = new aws.codebuild.Project(`${config.name}-build`, {
		name: `lancer-${config.name}`,
		description: `Build project for ${config.name} static site`,
		serviceRole: codebuildRole.arn,
		artifacts: {
			type: "NO_ARTIFACTS",
		},
		environment: {
			computeType: "BUILD_GENERAL1_SMALL",
			image: "aws/codebuild/amazonlinux2-x86_64-standard:5.0",
			type: "LINUX_CONTAINER",
		},
		source: {
			type: "GITHUB",
			location: config.gitUrl,
			gitCloneDepth: 1,
			buildspec: pulumi.all([bucket.bucket, distribution.id]).apply(([bucketName, distId]) =>
				generateStaticBuildspec({
					bucketName,
					distributionId: distId,
					buildCommand: config.buildCommand,
					outputDir: config.outputDir,
				}),
			),
		},
		sourceVersion: config.gitBranch,
		tags: mergeTags(tags, { Name: `${config.name}-build` }),
	});

	// Generate the URL
	const url = pulumi.interpolate`https://${distribution.domainName}`;

	return {
		bucketName: bucket.bucket,
		distributionId: distribution.id,
		distributionDomain: distribution.domainName,
		url,
	};
}
