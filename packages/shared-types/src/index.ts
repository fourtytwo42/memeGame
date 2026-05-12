export type StatGroup = "growth" | "belief" | "community" | "risk";

export interface HealthStatus {
  status: "ok" | "degraded" | "down";
  checkedAt: string;
}
