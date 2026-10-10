// Naming convention: lancer-{service-name}
const PREFIX = "lancer";

// Generate a resource name
export function resourceName(serviceName: string): string {
	return `${PREFIX}-${serviceName}`;
}

// Generate a resource name with suffix
export function resourceNameWithSuffix(serviceName: string, suffix: string): string {
	return `${PREFIX}-${serviceName}-${suffix}`;
}

// Foundation resource names
export const foundationNames = {
	vpc: resourceName("vpc"),
	internetGateway: resourceName("igw"),
	publicSubnet: (az: string) => resourceNameWithSuffix("subnet-public", az),
	routeTable: resourceName("rtb-public"),
	alb: resourceName("alb"),
	albSecurityGroup: resourceName("alb-sg"),
	ecsCluster: resourceName("cluster"),
	ecsSecurityGroup: resourceName("ecs-sg"),
	ecsInstanceRole: resourceName("ecs-instance-role"),
	ecsInstanceProfile: resourceName("ecs-instance-profile"),
};

// Service resource names
export function serviceNames(serviceName: string) {
	return {
		// ECS resources
		taskDefinition: resourceName(serviceName),
		service: resourceName(serviceName),
		targetGroup: resourceNameWithSuffix(serviceName, "tg"),
		ecrRepository: resourceName(serviceName),
		launchTemplate: resourceNameWithSuffix(serviceName, "lt"),
		autoScalingGroup: resourceNameWithSuffix(serviceName, "asg"),

		// S3 resources (for static sites)
		bucket: resourceName(serviceName),

		// CloudFront resources
		distribution: resourceName(serviceName),

		// RDS resources
		dbInstance: resourceName(serviceName),
		dbSubnetGroup: resourceNameWithSuffix(serviceName, "subnet-group"),
		dbSecurityGroup: resourceNameWithSuffix(serviceName, "db-sg"),
		dbSecret: resourceNameWithSuffix(serviceName, "secret"),

		// ElastiCache resources
		cacheCluster: resourceName(serviceName),
		cacheSubnetGroup: resourceNameWithSuffix(serviceName, "cache-subnet"),
		cacheSecurityGroup: resourceNameWithSuffix(serviceName, "cache-sg"),
	};
}

// Validate service name
export function validateServiceName(name: string): string | null {
	// Must be lowercase alphanumeric with hyphens
	if (!/^[a-z][a-z0-9-]*[a-z0-9]$/.test(name) && !/^[a-z]$/.test(name)) {
		return "Name must be lowercase alphanumeric with hyphens, starting with a letter";
	}

	// Must be between 1 and 28 characters (to leave room for prefixes/suffixes)
	if (name.length > 28) {
		return "Name must be 28 characters or less";
	}

	// Cannot be a reserved name
	const reserved = ["foundation", "vpc", "alb", "cluster"];
	if (reserved.includes(name)) {
		return `Name '${name}' is reserved`;
	}

	return null;
}
