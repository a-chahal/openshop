import { DuckDBInstance, DuckDBConnection } from '@duckdb/node-api';
import { traced, type TraceContext } from '../telemetry/trace.js';

let instance: DuckDBInstance | null = null;
let connection: DuckDBConnection | null = null;

async function getConnection(): Promise<DuckDBConnection> {
  if (!connection) {
    const token = process.env.MOTHERDUCK_TOKEN;
    if (!token) throw new Error('MOTHERDUCK_TOKEN not set');
    instance = await DuckDBInstance.create(`md:openshop?motherduck_token=${token}`);
    connection = await instance.connect();
  }
  return connection;
}

function coerceValue(val: unknown): unknown {
  if (typeof val === 'bigint') {
    return Number(val);
  }
  return val;
}

async function processResult(result: any): Promise<Record<string, any>[]> {
  const rows: Record<string, any>[] = [];
  const columns = result.columnNames();
  const columnCount = result.columnCount;
  while (true) {
    const chunk = await result.fetchChunk();
    if (chunk.rowCount === 0) break;
    for (let rowIdx = 0; rowIdx < chunk.rowCount; rowIdx++) {
      const row: any = {};
      for (let colIdx = 0; colIdx < columnCount; colIdx++) {
        row[columns[colIdx]] = coerceValue(chunk.getColumnValues(colIdx)[rowIdx]);
      }
      rows.push(row);
    }
  }
  return rows;
}

export async function query<T = Record<string, any>>(
  ctx: TraceContext,
  operation: string,
  sql: string
): Promise<T[]> {
  return traced(ctx, 'motherduck', operation, sql.substring(0, 200), async () => {
    try {
      const conn = await getConnection();
      const result = await conn.run(sql);
      return await processResult(result) as T[];
    } catch (err) {
      // Connection may be stale; reset and retry once
      connection = null;
      instance = null;
      const conn = await getConnection();
      const result = await conn.run(sql);
      return await processResult(result) as T[];
    }
  });
}
