import { randomUUID } from 'crypto';

export interface TraceContext {
  traceId: string;
  address: string;
  businessType: string;
  startTime: number;
}

export function createTrace(address: string, businessType: string): TraceContext {
  return { traceId: randomUUID(), address, businessType, startTime: Date.now() };
}

export async function traced<T>(
  ctx: TraceContext,
  service: 'arcgis' | 'motherduck' | 'openrouter',
  operation: string,
  inputSummary: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = Date.now();
  try {
    const result = await fn();
    const duration = Date.now() - start;
    const isEmpty = Array.isArray(result) && result.length === 0;
    const level = isEmpty ? '\u{1F7E1}' : duration > 5000 ? '\u{1F7E1}' : '\u{1F7E2}';
    console.log(`${level} [${ctx.traceId.slice(0, 8)}] ${service}/${operation} ${duration}ms${isEmpty ? ' EMPTY' : ''}`);
    return result;
  } catch (err: any) {
    const duration = Date.now() - start;
    console.error(`\u{1F534} [${ctx.traceId.slice(0, 8)}] FAILED ${service}/${operation} ${duration}ms`);
    console.error(`    Input: ${inputSummary.substring(0, 300)}`);
    console.error(`    Error: ${err.message}`);
    throw err;
  }
}
