import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { Order } from '@buffetya/shared';
import type { PickupCounterState } from '../../domain/pickup-code.js';

/** Everything the MVP persists. The catalog itself comes from the committed seed. */
export interface DatabaseState {
  version: 1;
  orders: Record<string, Order>;
  /** Stock toggles made from the backstage, by product id. */
  productAvailability: Record<string, boolean>;
  pickupCounter?: PickupCounterState;
}

export interface StoreLogger {
  warn(message: string): void;
}

const emptyState = (): DatabaseState => ({ version: 1, orders: {}, productAvailability: {} });

function isDatabaseState(value: unknown): value is DatabaseState {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Partial<DatabaseState>;
  return (
    candidate.version === 1 &&
    typeof candidate.orders === 'object' &&
    candidate.orders !== null &&
    typeof candidate.productAvailability === 'object' &&
    candidate.productAvailability !== null
  );
}

/**
 * A single JSON file as the database. The whole state lives in memory and is
 * written to disk after every change (temp file + rename, so a crash mid-write
 * never leaves half a file). Good enough for one process and a test session;
 * the repository ports let a Firebase adapter replace it without touching the
 * domain.
 */
export class JsonFileStore {
  private writeChain: Promise<void> = Promise.resolve();
  private queuedWrite: Promise<void> | null = null;

  private constructor(
    private readonly filePath: string,
    private readonly state: DatabaseState,
  ) {}

  static async open(filePath: string, logger: StoreLogger = console): Promise<JsonFileStore> {
    await mkdir(dirname(filePath), { recursive: true });

    let raw: string | undefined;
    try {
      raw = await readFile(filePath, 'utf8');
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }

    let state = emptyState();
    let needsWrite = raw === undefined;
    if (raw !== undefined) {
      let parsed: unknown;
      try {
        parsed = JSON.parse(raw);
      } catch {
        parsed = undefined;
      }
      if (isDatabaseState(parsed)) {
        state = parsed;
      } else {
        const backup = `${filePath}.corrupt-${Date.now()}`;
        await rename(filePath, backup);
        logger.warn(`Data file was unreadable; moved it to ${backup} and started clean.`);
        needsWrite = true;
      }
    }

    const store = new JsonFileStore(filePath, state);
    if (needsWrite) await store.persist();
    return store;
  }

  /** Reads a deep copy, so callers can never mutate stored data in place. */
  read<T>(selector: (state: Readonly<DatabaseState>) => T): T {
    return structuredClone(selector(this.state));
  }

  /** Applies a change in memory and resolves once it is on disk. */
  update(mutator: (state: DatabaseState) => void): Promise<void> {
    mutator(this.state);
    return this.persist();
  }

  /** Resolves when every pending write has reached the disk. */
  flush(): Promise<void> {
    return this.writeChain;
  }

  private persist(): Promise<void> {
    // Changes that arrive while a write is queued ride along with it.
    if (!this.queuedWrite) {
      const write = this.writeChain.then(() => {
        this.queuedWrite = null;
        return this.writeAtomically(JSON.stringify(this.state, null, 2));
      });
      this.queuedWrite = write;
      this.writeChain = write.catch(() => undefined);
    }
    return this.queuedWrite;
  }

  private async writeAtomically(contents: string): Promise<void> {
    const temp = `${this.filePath}.tmp`;
    await writeFile(temp, contents, 'utf8');
    try {
      await rename(temp, this.filePath);
    } catch {
      // Windows can refuse the rename while another process holds the file.
      await writeFile(this.filePath, contents, 'utf8');
      await rm(temp, { force: true });
    }
  }
}
