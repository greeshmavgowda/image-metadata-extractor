const request = require('supertest');
const app = require('../src/app');

let server;

beforeAll(done => {
  server = app.listen(0, () => done());
});

afterAll(done => {
  server.close(() => done());
});

test('GET /health returns UP', async () => {
  const res = await request(server).get('/health');
  expect(res.body.status).toBe('UP');
});
