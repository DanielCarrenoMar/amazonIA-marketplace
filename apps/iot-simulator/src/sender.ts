/**
 * HTTP sender — sends generated IoT events to the Ingestor Service.
 *
 * Uses native fetch (Node 18+) with exponential backoff retry.
 * Falls back to console logging in --dry-run mode.
 */

interface SenderConfig {
  ingestorUrl: string;
  apiKey: string;
  dryRun: boolean;
}

let config: SenderConfig;

export function initSender(cfg: SenderConfig): void {
  config = cfg;
}

/**
 * Send a single event or batch to the ingestor.
 *
 * @param endpoint - 'climate' | 'shipment' | 'batch/climate' | 'batch/shipment'
 * @param payload  - Single event DTO or array of DTOs
 */
export async function sendToIngestor(
  endpoint: string,
  payload: unknown,
): Promise<void> {
  if (config.dryRun) {
    console.log(`[DRY-RUN] POST /ingest/${endpoint}`, JSON.stringify(payload, null, 2));
    return;
  }

  const url = `${config.ingestorUrl}/ingest/${endpoint}`;

  // Retry with exponential backoff (max 3 attempts)
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': config.apiKey,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(`HTTP ${response.status}: ${body}`);
      }

      return; // Success
    } catch (error) {
      if (attempt === 3) {
        console.error(
          `Failed to send to ${endpoint} after 3 attempts:`,
          error instanceof Error ? error.message : error,
        );
        return;
      }

      // Exponential backoff: 500ms, 1000ms, 2000ms
      const delay = 500 * Math.pow(2, attempt - 1);
      console.warn(
        `Attempt ${attempt} failed for ${endpoint}, retrying in ${delay}ms...`,
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}
