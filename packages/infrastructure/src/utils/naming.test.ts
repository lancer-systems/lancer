import { describe, expect, it } from "vitest";

import {
	foundationNames,
	resourceName,
	resourceNameWithSuffix,
	serviceNames,
	validateServiceName,
} from "./naming.ts";

describe("resourceName", () => {
	it("creates prefixed name", () => {
		expect(resourceName("api")).toBe("lancer-api");
		expect(resourceName("frontend")).toBe("lancer-frontend");
		expect(resourceName("my-service")).toBe("lancer-my-service");
	});
});

describe("resourceNameWithSuffix", () => {
	it("creates prefixed name with suffix", () => {
		expect(resourceNameWithSuffix("api", "tg")).toBe("lancer-api-tg");
		expect(resourceNameWithSuffix("frontend", "sg")).toBe("lancer-frontend-sg");
	});
});

describe("foundationNames", () => {
	it("has correct VPC name", () => {
		expect(foundationNames.vpc).toBe("lancer-vpc");
	});

	it("has correct IGW name", () => {
		expect(foundationNames.internetGateway).toBe("lancer-igw");
	});

	it("has correct ALB name", () => {
		expect(foundationNames.alb).toBe("lancer-alb");
	});

	it("has correct ECS cluster name", () => {
		expect(foundationNames.ecsCluster).toBe("lancer-cluster");
	});

	it("generates public subnet name with AZ", () => {
		expect(foundationNames.publicSubnet("us-east-1a")).toBe("lancer-subnet-public-us-east-1a");
		expect(foundationNames.publicSubnet("eu-west-1b")).toBe("lancer-subnet-public-eu-west-1b");
	});
});

describe("serviceNames", () => {
	it("generates correct names for service", () => {
		const names = serviceNames("api");

		expect(names.taskDefinition).toBe("lancer-api");
		expect(names.service).toBe("lancer-api");
		expect(names.targetGroup).toBe("lancer-api-tg");
		expect(names.ecrRepository).toBe("lancer-api");
		expect(names.launchTemplate).toBe("lancer-api-lt");
		expect(names.autoScalingGroup).toBe("lancer-api-asg");
	});

	it("generates correct S3 bucket name", () => {
		const names = serviceNames("frontend");
		expect(names.bucket).toBe("lancer-frontend");
	});

	it("generates correct database names", () => {
		const names = serviceNames("mydb");
		expect(names.dbInstance).toBe("lancer-mydb");
		expect(names.dbSubnetGroup).toBe("lancer-mydb-subnet-group");
		expect(names.dbSecurityGroup).toBe("lancer-mydb-db-sg");
		expect(names.dbSecret).toBe("lancer-mydb-secret");
	});

	it("generates correct cache names", () => {
		const names = serviceNames("cache");
		expect(names.cacheCluster).toBe("lancer-cache");
		expect(names.cacheSubnetGroup).toBe("lancer-cache-cache-subnet");
		expect(names.cacheSecurityGroup).toBe("lancer-cache-cache-sg");
	});
});

describe("validateServiceName", () => {
	it("accepts valid names", () => {
		expect(validateServiceName("api")).toBeNull();
		expect(validateServiceName("my-api")).toBeNull();
		expect(validateServiceName("api-v2")).toBeNull();
		expect(validateServiceName("a")).toBeNull();
		expect(validateServiceName("frontend-app")).toBeNull();
	});

	it("rejects names starting with non-letter", () => {
		expect(validateServiceName("1api")).not.toBeNull();
		expect(validateServiceName("-api")).not.toBeNull();
		expect(validateServiceName("123")).not.toBeNull();
	});

	it("rejects names ending with hyphen", () => {
		expect(validateServiceName("api-")).not.toBeNull();
		expect(validateServiceName("my-api-")).not.toBeNull();
	});

	it("rejects names with uppercase", () => {
		expect(validateServiceName("Api")).not.toBeNull();
		expect(validateServiceName("myAPI")).not.toBeNull();
		expect(validateServiceName("MY-SERVICE")).not.toBeNull();
	});

	it("rejects names with special characters", () => {
		expect(validateServiceName("my_api")).not.toBeNull();
		expect(validateServiceName("my.api")).not.toBeNull();
		expect(validateServiceName("my api")).not.toBeNull();
	});

	it("rejects names longer than 28 characters", () => {
		expect(validateServiceName("a".repeat(29))).not.toBeNull();
		expect(validateServiceName("a".repeat(28))).toBeNull();
	});

	it("rejects reserved names", () => {
		expect(validateServiceName("foundation")).not.toBeNull();
		expect(validateServiceName("vpc")).not.toBeNull();
		expect(validateServiceName("alb")).not.toBeNull();
		expect(validateServiceName("cluster")).not.toBeNull();
	});
});
