export interface HealthResponse {
	status: "healthy" | "unhealthy";
	database: "connected" | "disconnected";
}
