import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import * as random from "@pulumi/random";

import type { DatabaseConfig, DatabaseOutputs } from "../../types/index.ts";
import { serviceNames } from "../../utils/naming.ts";
import { mergeTags, serviceTags } from "../../utils/tags.ts";

// Instance type mapping for databases
const DB_INSTANCE_TYPES: Record<string, string> = {
	small: "db.t4g.micro",
	medium: "db.t4g.small",
	large: "db.t4g.medium",
};

// Storage allocation by size
const DB_STORAGE: Record<string, number> = {
	small: 20,
	medium: 50,
	large: 100,
};

export interface DatabaseInfraConfig extends DatabaseConfig {
	vpcId: string;
	subnetIds: string[];
	ecsSecurityGroupId: string;
	accountId: string;
	region: string;
}

// Create database infrastructure
export function createDatabase(config: DatabaseInfraConfig): DatabaseOutputs {
	const names = serviceNames(config.name);
	const tags = serviceTags(config.name, "database");
	const instanceClass = DB_INSTANCE_TYPES[config.size] || "db.t4g.micro";
	const allocatedStorage = DB_STORAGE[config.size] || 20;

	// Generate random password for database
	const password = new random.RandomPassword(`${config.name}-db-password`, {
		length: 24,
		special: true,
		overrideSpecial: "!#$%&*()-_=+[]{}<>:?",
	});

	// Create DB subnet group
	const subnetGroup = new aws.rds.SubnetGroup(names.dbSubnetGroup, {
		name: names.dbSubnetGroup,
		subnetIds: config.subnetIds,
		tags: mergeTags(tags, { Name: names.dbSubnetGroup }),
	});

	// Create security group for database
	const dbSecurityGroup = new aws.ec2.SecurityGroup(names.dbSecurityGroup, {
		vpcId: config.vpcId,
		description: `Security group for ${config.name} database`,
		ingress: [
			{
				description: "Allow traffic from ECS",
				fromPort: config.engine === "postgres" ? 5432 : 3306,
				toPort: config.engine === "postgres" ? 5432 : 3306,
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
		tags: mergeTags(tags, { Name: names.dbSecurityGroup }),
	});

	// Create RDS instance
	const db = new aws.rds.Instance(names.dbInstance, {
		identifier: names.dbInstance,
		instanceClass,
		allocatedStorage,
		storageType: "gp3",
		engine: config.engine,
		engineVersion: config.engine === "postgres" ? "16.4" : "8.0",
		dbName: config.name.replace(/-/g, "_"),
		username: "lancer_admin",
		password: password.result,
		dbSubnetGroupName: subnetGroup.name,
		vpcSecurityGroupIds: [dbSecurityGroup.id],
		publiclyAccessible: false,
		skipFinalSnapshot: true, // For MVP simplicity
		deletionProtection: false,
		backupRetentionPeriod: 7,
		multiAz: false, // Single AZ to save cost
		storageEncrypted: true,
		tags: mergeTags(tags, { Name: names.dbInstance }),
	});

	// Store credentials in Secrets Manager
	const secret = new aws.secretsmanager.Secret(names.dbSecret, {
		name: `/lancer/${config.name}/database-credentials`,
		description: `Database credentials for ${config.name}`,
		tags: mergeTags(tags, { Name: names.dbSecret }),
	});

	// Store secret value
	new aws.secretsmanager.SecretVersion(`${config.name}-secret-version`, {
		secretId: secret.id,
		secretString: pulumi
			.all([db.endpoint, db.port, password.result])
			.apply(([endpoint, port, pwd]) =>
				JSON.stringify({
					username: "lancer_admin",
					password: pwd,
					host: endpoint.split(":")[0],
					port,
					database: config.name.replace(/-/g, "_"),
					engine: config.engine,
				}),
			),
	});

	// Store DATABASE_URL in SSM for easy access
	new aws.ssm.Parameter(`${config.name}-db-url`, {
		name: `/lancer/${config.name}/DATABASE_URL`,
		type: "SecureString",
		value: pulumi.all([db.endpoint, password.result]).apply(([endpoint, pwd]) => {
			const host = endpoint.split(":")[0];
			const port = config.engine === "postgres" ? 5432 : 3306;
			const dbName = config.name.replace(/-/g, "_");
			const protocol = config.engine === "postgres" ? "postgresql" : "mysql";
			return `${protocol}://lancer_admin:${encodeURIComponent(pwd)}@${host}:${port}/${dbName}`;
		}),
		tags: mergeTags(tags, { Name: `${config.name}-db-url` }),
	});

	return {
		instanceId: db.id,
		endpoint: db.endpoint,
		port: db.port,
		secretArn: secret.arn,
	};
}
