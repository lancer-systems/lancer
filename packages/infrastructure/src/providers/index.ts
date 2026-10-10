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
} from "../types/index.ts";

// Cloud provider interface for multi-cloud support
export interface CloudProvider {
	readonly name: string;

	// Foundation infrastructure
	createFoundation(config: FoundationConfig): Promise<FoundationOutputs>;
	destroyFoundation(): Promise<void>;

	// Web services (ECS on EC2)
	createWebService(config: WebServiceConfig): Promise<WebServiceOutputs>;

	// Static sites (S3 + CloudFront)
	createStaticSite(config: StaticSiteConfig): Promise<StaticSiteOutputs>;

	// Databases (RDS)
	createDatabase(config: DatabaseConfig): Promise<DatabaseOutputs>;

	// Cache (ElastiCache)
	createCache(config: CacheConfig): Promise<CacheOutputs>;

	// Service management
	listServices(): Promise<ServiceMetadata[]>;
	deleteService(name: string): Promise<void>;
}

// Re-export types for convenience
export type {
	FoundationConfig,
	FoundationOutputs,
	WebServiceConfig,
	WebServiceOutputs,
	StaticSiteConfig,
	StaticSiteOutputs,
	DatabaseConfig,
	DatabaseOutputs,
	CacheConfig,
	CacheOutputs,
	ServiceMetadata,
};
