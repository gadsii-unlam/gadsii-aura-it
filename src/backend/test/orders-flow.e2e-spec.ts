import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { get, type IncomingMessage } from 'node:http';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Test } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/bootstrap.js';
import type { AppConfig } from '../src/config.js';

const KEY = 'test-backstage-key';
const SEED = fileURLToPath(new URL('../data/seed/products.json', import.meta.url));
const CART = [
  { productId: 'milanesa-napolitana', quantity: 1 },
  { productId: 'tarta-verdura', quantity: 1 },
];

describe('BuffetYa! HTTP API', () => {
  let app: NestExpressApplication;
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'buffetya-e2e-'));
    const webDir = join(dir, 'web');
    await mkdir(webDir);
    await writeFile(join(webDir, 'index.html'), '<!doctype html><title>BuffetYa!</title>');
    await writeFile(join(webDir, 'main.js'), 'console.log("app")');

    const config: AppConfig = {
      port: 0,
      production: false,
      corsOrigins: [],
      backstageKey: KEY,
      dataFile: join(dir, 'data', 'db.json'),
      seedFile: SEED,
      webDir,
      pickupHoldMinutes: 15,
      timeZone: 'America/Argentina/Buenos_Aires',
    };
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule.register(config)],
    }).compile();
    app = moduleRef.createNestApplication<NestExpressApplication>({ logger: false });
    configureApp(app, config);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
    await rm(dir, { recursive: true, force: true });
  });

  const api = () => request(app.getHttpServer());
  const backstage = (method: 'get' | 'post' | 'put' | 'patch', path: string) =>
    api()[method](`/api/backstage${path}`).set('x-backstage-key', KEY);

  async function placeOrder(): Promise<string> {
    const response = await api()
      .post('/api/orders')
      .send({ customerName: 'Martín', items: CART })
      .expect(201);
    return response.body.id;
  }

  describe('menu', () => {
    it('lists the products with their stock', async () => {
      const response = await api().get('/api/products').expect(200);
      const medialunas = response.body.find((p: { id: string }) => p.id === 'medialunas-x3');
      expect(medialunas).toMatchObject({ name: 'Medialunas x3', available: false });
    });

    it('quotes a cart with server prices and the time estimate', async () => {
      const response = await api().post('/api/orders/quote').send({ items: CART }).expect(200);
      expect(response.body.totalCents).toBe(800_000);
      expect(response.body.estimate).toEqual({ minMinutes: 12, maxMinutes: 15 });
    });
  });

  describe('placing an order', () => {
    it('creates it unpaid, priced by the server', async () => {
      const response = await api()
        .post('/api/orders')
        .send({ customerName: 'Martín', items: CART, totalCents: 1 })
        .expect(201);
      expect(response.body).toMatchObject({
        status: 'awaiting_payment',
        paymentStatus: 'pending',
        totalCents: 800_000,
        customerName: 'Martín',
      });
      expect(response.body.pickupCode).toBeUndefined();
    });

    it.each([
      ['an empty name', { customerName: '  ', items: CART }, 400, 'INVALID_REQUEST'],
      ['a zero quantity', { customerName: 'Martín', items: [{ productId: 'tarta-verdura', quantity: 0 }] }, 400, 'INVALID_REQUEST'],
      ['no items', { customerName: 'Martín', items: [] }, 400, 'INVALID_REQUEST'],
      ['an unknown product', { customerName: 'Martín', items: [{ productId: 'caviar', quantity: 1 }] }, 422, 'UNKNOWN_PRODUCT'],
      ['a product without stock', { customerName: 'Martín', items: [{ productId: 'medialunas-x3', quantity: 1 }] }, 409, 'PRODUCT_UNAVAILABLE'],
    ])('rejects %s', async (_label, body, status, code) => {
      const response = await api().post('/api/orders').send(body).expect(status);
      expect(response.body.code).toBe(code);
      expect(typeof response.body.message).toBe('string');
    });

    it('answers 404 for an unknown order', async () => {
      const response = await api().get('/api/orders/nope').expect(404);
      expect(response.body.code).toBe('ORDER_NOT_FOUND');
    });
  });

  describe('the whole flow', () => {
    it('rejected payment stays out of the kitchen; approved payment enters it and moves to ready', async () => {
      const orderId = await placeOrder();

      // The team forces the next payment to fail.
      await backstage('put', '/payments/next').send({ nextResult: 'reject' }).expect(200, {
        nextResult: 'reject',
      });

      const rejected = await api().post(`/api/orders/${orderId}/payments`).send({}).expect(200);
      expect(rejected.body.result).toBe('rejected');
      expect(rejected.body.order.status).toBe('awaiting_payment');
      expect((await backstage('get', '/orders').expect(200)).body).toEqual([]);

      // The one-shot rejection is spent: the retry is approved.
      const approved = await api().post(`/api/orders/${orderId}/payments`).send({}).expect(200);
      expect(approved.body.result).toBe('approved');
      expect(approved.body.order).toMatchObject({ status: 'received', pickupCode: 'B-001' });
      expect((await backstage('get', '/orders').expect(200)).body.map((o: { id: string }) => o.id)).toEqual([orderId]);

      await backstage('post', `/orders/${orderId}/status`).send({ status: 'preparing' }).expect(200);
      const ready = await backstage('post', `/orders/${orderId}/status`)
        .send({ status: 'ready' })
        .expect(200);
      expect(ready.body.status).toBe('ready');
      expect(ready.body.pickupDeadlineAt).toBeDefined();

      const illegal = await backstage('post', `/orders/${orderId}/status`)
        .send({ status: 'received' })
        .expect(409);
      expect(illegal.body.code).toBe('ILLEGAL_TRANSITION');

      expect((await api().get(`/api/orders/${orderId}`).expect(200)).body.status).toBe('ready');
    });

    it('never charges an order twice', async () => {
      const orderId = await placeOrder();
      await api().post(`/api/orders/${orderId}/payments`).send({}).expect(200);
      const second = await api().post(`/api/orders/${orderId}/payments`).send({}).expect(409);
      expect(second.body.code).toBe('PAYMENT_NOT_ALLOWED');
    });
  });

  describe('backstage', () => {
    it('requires the key', async () => {
      await api().get('/api/backstage/orders').expect(401);
      await api().get('/api/backstage/orders').set('x-backstage-key', 'wrong').expect(401);
    });

    it('toggles stock', async () => {
      await backstage('patch', '/products/medialunas-x3').send({ available: true }).expect(200);
      const products = (await api().get('/api/products').expect(200)).body;
      expect(products.find((p: { id: string }) => p.id === 'medialunas-x3').available).toBe(true);

      const missing = await backstage('patch', '/products/caviar').send({ available: true }).expect(404);
      expect(missing.body.code).toBe('PRODUCT_NOT_FOUND');
    });

    it('reports and resets the simulated payment mode', async () => {
      await backstage('get', '/payments/next').expect(200, { nextResult: 'approve' });
      await backstage('put', '/payments/next').send({ nextResult: 'maybe' }).expect(400);
    });
  });

  describe('live status (SSE)', () => {
    it('sends the current order, then every change', async () => {
      await app.listen(0);
      const { port } = app.getHttpServer().address() as AddressInfo;
      const orderId = await placeOrder();

      const events: { status: string }[] = [];
      const response = await new Promise<IncomingMessage>((resolve, reject) => {
        get(`http://127.0.0.1:${port}/api/orders/${orderId}/events`, resolve).on('error', reject);
      });
      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toContain('text/event-stream');

      const received = new Promise<void>((resolve) => {
        let buffer = '';
        response.on('data', (chunk: Buffer) => {
          buffer += chunk.toString('utf8');
          const blocks = buffer.split('\n\n');
          buffer = blocks.pop() ?? '';
          for (const block of blocks) {
            const data = block
              .split('\n')
              .filter((line) => line.startsWith('data: '))
              .map((line) => line.slice(6))
              .join('');
            if (data) events.push(JSON.parse(data));
          }
          if (events.length >= 2) resolve();
        });
      });

      await api().post(`/api/orders/${orderId}/payments`).send({}).expect(200);
      await received;
      response.destroy();

      expect(events.map((event) => event.status)).toEqual(['awaiting_payment', 'received']);
    });

    it('follows several orders over one stream, each with its own changes', async () => {
      await app.listen(0);
      const { port } = app.getHttpServer().address() as AddressInfo;
      const first = await placeOrder();
      const second = await placeOrder();
      await api().post(`/api/orders/${first}/payments`).send({}).expect(200);

      const events: { id: string; status: string; pickupCode?: string }[] = [];
      const response = await new Promise<IncomingMessage>((resolve, reject) => {
        get(`http://127.0.0.1:${port}/api/orders/events?ids=${first},${second},unknown`, resolve).on(
          'error',
          reject,
        );
      });
      expect(response.statusCode).toBe(200);
      const done = new Promise<void>((resolve) => {
        let buffer = '';
        response.on('data', (chunk: Buffer) => {
          buffer += chunk.toString('utf8');
          const blocks = buffer.split('\n\n');
          buffer = blocks.pop() ?? '';
          for (const block of blocks) {
            const data = block
              .split('\n')
              .filter((line) => line.startsWith('data: '))
              .map((line) => line.slice(6))
              .join('');
            if (data) events.push(JSON.parse(data));
          }
          if (events.length >= 4) resolve();
        });
      });

      // Snapshot of both known orders first, then live changes of either one.
      await new Promise((resolve) => setTimeout(resolve, 100));
      await api().post(`/api/orders/${second}/payments`).send({}).expect(200);
      await backstage('post', `/orders/${first}/status`).send({ status: 'preparing' }).expect(200);
      await done;
      response.destroy();

      expect(events.slice(0, 2).map((e) => [e.id, e.status])).toEqual([
        [first, 'received'],
        [second, 'awaiting_payment'],
      ]);
      expect(events.slice(2).map((e) => [e.id, e.status, e.pickupCode])).toEqual([
        [second, 'received', 'B-002'],
        [first, 'preparing', 'B-001'],
      ]);
    });

    it('rejects a stream request without valid ids', async () => {
      const response = await api().get('/api/orders/events').expect(400);
      expect(response.body.code).toBe('INVALID_REQUEST');
    });

    it('answers 404 before opening a stream for an unknown order', async () => {
      const response = await api().get('/api/orders/nope/events').expect(404);
      expect(response.body.code).toBe('ORDER_NOT_FOUND');
    });
  });

  describe('single deployable', () => {
    it('serves the web app and falls back to it for client routes', async () => {
      expect((await api().get('/').expect(200)).text).toContain('BuffetYa!');
      const deep = await api().get('/carrito').set('Accept', 'text/html').expect(200);
      expect(deep.text).toContain('BuffetYa!');
      expect(deep.headers['cache-control']).toContain('no-cache');
      await api().get('/main.js').expect(200);
    });

    it('keeps API 404s as JSON and missing files as 404', async () => {
      const response = await api().get('/api/nope').expect(404);
      expect(response.body.code).toBe('NOT_FOUND');
      await api().get('/missing.js').expect(404);
    });
  });
});
