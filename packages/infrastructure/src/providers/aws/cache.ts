import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";

import type { CacheConfig, CacheOutputs } from "../../types/index.ts";
import { serviceNames } from "../../utils/naming.ts";
import { mergeTags, serviceTags } from "../../utils/tags.ts";

// Instance type mapping for cache (Valkey/Redis compatible)
const CACHE_INSTANCE_TYPES: Record<string, string> = {
	small: "cache.t4g.micro",
	medium: "cache.t4g.small",
	large: "cache.t4g.medium",
};

export interface CacheInfraConfig extends CacheConfig {
	vpcId: string;
	subnetIds: string[];
	ecsSecurityGroupId: string;
	region: string;
}

// Create cache infrastructure (ElastiCache Valkey)
export function createCache(config: CacheInfraConfig): CacheOutputs {
	const names = serviceNames(config.name);
	const tags = serviceTags(config.name, "cache");
	const nodeType = CACHE_INSTANCE_TYPES[config.size] || "cache.t4g.micro";

	// Create cache subnet group
	const subnetGroup = new aws.elasticache.SubnetGroup(names.cacheSubnetGroup, {
		name: names.cacheSubnetGroup,
		subnetIds: config.subnetIds,
		tags: mergeTags(tags, { Name: names.cacheSubnetGroup }),
	});

	// Create security group for cache
	const cacheSecurityGroup = new aws.ec2.SecurityGroup(names.cacheSecurityGroup, {
		vpcId: config.vpcId,
		description: `Security group for ${config.name} cache`,
		ingress: [
			{
				description: "Allow traffic from ECS",
				fromPort: 6379,
				toPort: 6379,
				protocol: "tcp",
				securityGroups: [config.ecsSecurityGroupId],
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
		tags: mergeTags(tags, { Name: names.cacheSecurityGroup }),
	});

	// Create ElastiCache Valkey cluster (serverless is cheaper but we use node-based for predictability)
	const cache = new aws.elasticache.Cluster(names.cacheCluster, {
		clusterId: names.cacheCluster,
		engine: "valkey",
		engineVersion: "8.0",
		nodeType,
		numCacheNodes: 1,
		parameterGroupName: "default.valkey8",
		subnetGroupName: subnetGroup.name,
		securityGroupIds: [cacheSecurityGroup.id],
		port: 6379,
		tags: mergeTags(tags, { Name: names.cacheCluster }),
	});

	// Store REDIS_URL in SSM for easy access
	new aws.ssm.Parameter(`${config.name}-redis-url`, {
		name: `/lancer/${config.name}/REDIS_URL`,
		type: "String",
		value: pulumi.interpolate`redis://${cache.cacheNodes[0].address}:6379`,
		tags: mergeTags(tags, { Name: `${config.name}-redis-url` }),
	});

	return {
		clusterId: cache.clusterId,
		endpoint: cache.cacheNodes[0].address,
		port: cache.port,
	};
}
