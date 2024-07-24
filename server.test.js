const request = require('supertest');
const app = require('./server'); // 替换为你的Express应用

describe('GET /config', () => {
  it('should return game config', async () => {
    const res = await request(app).get('/config').set('x-api-key', 'your-secret-api-key');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('ScreenConfig');
  });
});

