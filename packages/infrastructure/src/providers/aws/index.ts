import type {
	CacheConfig,
	CacheOutputs,
	DatabaseConfig,
	DatabaseOutputs,
	FoundationConfig,
	FoundationOutputs,
	ServiceMetadata,
	StaticSiteConfig,
	StaticSiteOutputs,
	WebServiceConfig,
	WebServiceOutputs,
} from "../../types/index.ts";
import type { CloudProvider } from "../index.ts";
import { createFoundation } from "./foundation.ts";

// AWS Provider implementation
export class AWSProvider implements CloudProvider {
	readonly name = "aws";

	async createFoundation(config: FoundationConfig): Promise<FoundationOutputs> {
		return createFoundation(config);
	}

	async destroyFoundation(): Promise<void> {
		// TODO: Implement with Pulumi Automation API
		throw new Error("Not implemented");
	}

	async createWebService(_config: WebServiceConfig): Promise<WebServiceOutputs> {
		// TODO: Implement
		throw new Error("Not implemented");
	}

	async createStaticSite(_config: StaticSiteConfig): Promise<StaticSiteOutputs> {
		// TODO: Implement
		throw new Error("Not implemented");
	}

	async createDatabase(_config: DatabaseConfig): Promise<DatabaseOutputs> {
		// TODO: Implement
		throw new Error("Not implemented");
	}

	async createCache(_config: CacheConfig): Promise<CacheOutputs> {
		// TODO: Implement
		throw new Error("Not implemented");
	}

	async listServices(): Promise<ServiceMetadata[]> {
		// TODO: Implement by reading from local services.json or querying AWS
		return [];
	}

	async deleteService(_name: string): Promise<void> {
		// TODO: Implement
		throw new Error("Not implemented");
	}
}

// Export functions directly for Pulumi programs
export { type CacheInfraConfig, createCache } from "./cache.ts";
export { createDatabase, type DatabaseInfraConfig } from "./database.ts";
export { createFoundation } from "./foundation.ts";
export {
	type DeployLancerConfig,
	type DeployLancerResult,
	deployLancer,
	type PreviewLancerResult,
	previewLancer,
} from "./lancer-api.ts";
export { createStaticSite, type StaticSiteInfraConfig } from "./static-site.ts";
export { createWebService, type WebServiceInfraConfig } from "./web-service.ts";
