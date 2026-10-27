import { randomUUID } from 'node:crypto';
import type { Clock, IdGenerator } from '../application/ports.js';

export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }
}

/** Unguessable order ids: the order URL is the only "credential" of an anonymous order. */
export class RandomIds implements IdGenerator {
  next(): string {
    return randomUUID();
  }
}
