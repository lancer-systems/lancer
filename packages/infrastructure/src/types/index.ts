import type * as pulumi from "@pulumi/pulumi";

// Foundation configuration
export interface FoundationConfig {
	region: string;
	profile?: string;
}

// Foundation outputs
export interface FoundationOutputs {
	vpcId: pulumi.Output<string>;
	subnetIds: pulumi.Output<string[]>;
	albArn: pulumi.Output<string>;
	albDnsName: pulumi.Output<string>;
	albListenerArn: pulumi.Output<string>;
	ecsClusterArn: pulumi.Output<string>;
	ecsSecurityGroupId: pulumi.Output<string>;
	ecsInstanceProfileName: pulumi.Output<string>;
}

// Web service configuration
export interface WebServiceConfig {
	name: string;
	size: "nano" | "micro" | "small" | "medium" | "large";
	gitUrl: string;
	gitBranch: string;
	gitPath?: string;
	buildCommand: string;
	startCommand: string;
	port: number;
	customDomain?: string;
	environment?: Record<string, string>;
	ebsVolume?: {
		size: number;
		containerPath: string;
	};
	healthCheckPath?: string;
}

// Web service outputs
export interface WebServiceOutputs {
	serviceArn: pulumi.Output<string>;
	taskDefinitionArn: pulumi.Output<string>;
	targetGroupArn: pulumi.Output<string>;
	ecrRepositoryUrl: pulumi.Output<string>;
	url: pulumi.Output<string>;
}

// Static site configuration
export interface StaticSiteConfig {
	name: string;
	gitUrl: string;
	gitBranch: string;
	gitPath?: string;
	buildCommand: string;
	outputDir: string;
	customDomain?: string;
}

// Static site outputs
export interface StaticSiteOutputs {
	bucketName: pulumi.Output<string>;
	distributionId: pulumi.Output<string>;
	distributionDomain: pulumi.Output<string>;
	url: pulumi.Output<string>;
}

// Database configuration
export interface DatabaseConfig {
	name: string;
	engine: "postgres" | "mysql";
	size: "small" | "medium" | "large";
}

// Database outputs
export interface DatabaseOutputs {
	instanceId: pulumi.Output<string>;
	endpoint: pulumi.Output<string>;
	port: pulumi.Output<number>;
	secretArn: pulumi.Output<string>;
}

// Cache configuration
export interface CacheConfig {
	name: string;
	size: "small" | "medium" | "large";
}

// Cache outputs
export interface CacheOutputs {
	clusterId: pulumi.Output<string>;
	endpoint: pulumi.Output<string>;
	port: pulumi.Output<number>;
}

// Service metadata
export interface ServiceMetadata {
	name: string;
	type: "web" | "static" | "database" | "cache";
	size?: string;
	url?: string;
	createdAt: string;
}

// Lancer tags
export interface LancerTags {
	"lancer:managed": "true";
	"lancer:service": string;
	"lancer:type": "foundation" | "web" | "static" | "database" | "cache";
	"lancer:version": string;
	"lancer:created-at": string;
}
