export interface ApiLogEntry {
  endpoint: string;
  method: string;
  userId?: string;
  statusCode: number;
  success: boolean;
  durationMs: number;
  errorMessage?: string;
}

export function logApiActivity(entry: ApiLogEntry) {
  const payload = {
    timestamp: new Date().toISOString(),
    ...entry,
  };

  if (entry.success) {
    console.log("[API_CONSOLE_LOG]", JSON.stringify(payload));
  } else {
    console.warn("[API_CONSOLE_WARN]", JSON.stringify(payload));
  }
}