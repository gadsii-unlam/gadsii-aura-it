import { mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Order, Product } from '@buffetya/shared';
import { JsonFileStore } from './json-file-store.js';
import {
  JsonOrderRepository,
  JsonPickupCounterRepository,
  JsonProductRepository,
} from './json-repositories.js';
import { loadProductSeed } from './product-seed.js';

const seed: Product[] = [
  {
    id: 'tarta',
    name: 'Tarta de verdura porción',
    priceCents: 320_000,
    category: 'mains',
    dietaryTags: ['vegetarian'],
    available: true,
    prepMinutes: 8,
  },
  {
    id: 'medialunas',
    name: 'Medialunas x3',
    priceCents: 210_000,
    category: 'bakery',
    dietaryTags: [],
    available: false,
    prepMinutes: 2,
  },
];

const order: Order = {
  id: 'order-1',
  pickupCode: 'B-047',
  customerName: 'Martín',
  items: [
    {
      productId: 'tarta',
      name: 'Tarta de verdura porción',
      quantity: 1,
      unitPriceCents: 320_000,
      lineTotalCents: 320_000,
    },
  ],
  totalCents: 320_000,
  status: 'received',
  paymentMethod: 'mercado_pago',
  paymentStatus: 'approved',
  estimate: { minMinutes: 8, maxMinutes: 11 },
  createdAt: '2026-10-25T21:24:00.000Z',
  paidAt: '2026-10-25T21:24:30.000Z',
};

describe('JSON file persistence', () => {
  let dir: string;
  let file: string;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'buffetya-'));
    file = join(dir, 'nested', 'db.json');
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it('survives a restart: orders, stock changes and the pickup counter', async () => {
    const first = await JsonFileStore.open(file);
    await new JsonOrderRepository(first).save(order);
    await new JsonProductRepository(first, seed).setAvailability('tarta', false);
    await new JsonProductRepository(first, seed).setAvailability('medialunas', true);
    await new JsonPickupCounterRepository(first).save({ dateKey: '2026-10-25', lastSequence: 47 });
    await first.flush();

    const second = await JsonFileStore.open(file);
    const products = await new JsonProductRepository(second, seed).findAll();

    expect(await new JsonOrderRepository(second).findById('order-1')).toEqual(order);
    expect(products.map((p) => [p.id, p.available])).toEqual([
      ['tarta', false],
      ['medialunas', true],
    ]);
    expect(await new JsonPickupCounterRepository(second).load()).toEqual({
      dateKey: '2026-10-25',
      lastSequence: 47,
    });
  });

  it('starts from the seed when there is no data file', async () => {
    const store = await JsonFileStore.open(file);
    const products = await new JsonProductRepository(store, seed).findAll();
    expect(products).toEqual(seed);
    expect(await new JsonOrderRepository(store).findById('order-1')).toBeUndefined();
  });

  it('hands out copies, so callers cannot change stored data by accident', async () => {
    const store = await JsonFileStore.open(file);
    const orders = new JsonOrderRepository(store);
    await orders.save(order);

    const loaded = await orders.findById('order-1');
    if (loaded) loaded.status = 'cancelled';

    expect((await orders.findById('order-1'))?.status).toBe('received');
  });

  it('filters orders by status', async () => {
    const store = await JsonFileStore.open(file);
    const orders = new JsonOrderRepository(store);
    await orders.save(order);
    await orders.save({ ...order, id: 'order-2', status: 'awaiting_payment' });

    expect((await orders.findByStatus(['received'])).map((o) => o.id)).toEqual(['order-1']);
  });

  it('returns undefined when toggling a product that does not exist', async () => {
    const store = await JsonFileStore.open(file);
    expect(await new JsonProductRepository(store, seed).setAvailability('caviar', true)).toBeUndefined();
  });

  it('keeps a corrupted file aside and starts clean instead of crashing', async () => {
    await JsonFileStore.open(file);
    await writeFile(file, '{ not json');

    const store = await JsonFileStore.open(file);

    expect(await new JsonOrderRepository(store).findByStatus(['received'])).toEqual([]);
    const files = await readdir(join(dir, 'nested'));
    expect(files.some((name) => name.startsWith('db.json.corrupt-'))).toBe(true);
  });

  it('writes valid JSON to disk', async () => {
    const store = await JsonFileStore.open(file);
    await new JsonOrderRepository(store).save(order);
    await store.flush();
    const onDisk = JSON.parse(await readFile(file, 'utf8'));
    expect(onDisk.orders['order-1'].pickupCode).toBe('B-047');
  });
});

describe('product seed', () => {
  it('loads the committed seed and every product is well formed', async () => {
    const products = await loadProductSeed(
      new URL('../../../data/seed/products.json', import.meta.url),
    );
    expect(products.length).toBeGreaterThanOrEqual(4);
    // The four products drawn in wireframe D, verbatim.
    const byName = new Map(products.map((p) => [p.name, p]));
    expect(byName.get('Milanesa napolitana con papas')?.priceCents).toBe(480_000);
    expect(byName.get('Tarta de verdura porción')?.dietaryTags).toEqual(['vegetarian']);
    expect(byName.get('Empanada de carne')?.priceCents).toBe(140_000);
    expect(byName.get('Medialunas x3')?.available).toBe(false);
    expect(new Set(products.map((p) => p.id)).size).toBe(products.length);
  });

  it('gives every product a photo served by the web app', async () => {
    const products = await loadProductSeed(
      new URL('../../../data/seed/products.json', import.meta.url),
    );
    for (const product of products) {
      expect(product.imageUrl).toBe(`/products/${product.id}.jpg`);
      const photo = new URL(`../../../../frontend/public${product.imageUrl}`, import.meta.url);
      const bytes = await readFile(photo);
      // A real JPEG, not an HTML error page saved with a .jpg name.
      expect([...bytes.subarray(0, 3)]).toEqual([0xff, 0xd8, 0xff]);
    }
  });

  it('rejects an image URL that is not a site path', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'buffetya-seed-'));
    const path = join(dir, 'products.json');
    const product = {
      id: 'x',
      name: 'X',
      priceCents: 100,
      category: 'mains',
      dietaryTags: [],
      available: true,
      prepMinutes: 1,
    };
    await writeFile(path, JSON.stringify([{ ...product, imageUrl: 'javascript:alert(1)' }]));
    await expect(loadProductSeed(path)).rejects.toThrow(/seed/i);
    await rm(dir, { recursive: true, force: true });
  });

  it('rejects a malformed seed', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'buffetya-seed-'));
    const path = join(dir, 'products.json');
    await writeFile(path, JSON.stringify([{ id: 'x', name: 'X', priceCents: -1 }]));
    await expect(loadProductSeed(path)).rejects.toThrow(/seed/i);
    await rm(dir, { recursive: true, force: true });
  });
});
