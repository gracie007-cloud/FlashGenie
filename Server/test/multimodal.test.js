import request from 'supertest';
import app from '../src/index.js';

describe('Express app basic endpoints', () => {
	it('GET /health returns ok', async () => {
		const res = await request(app).get('/health');
		expect(res.status).toBe(200);
		expect(res.body).toEqual({ status: 'ok' });
	});

	it('POST /generate with empty body returns 400', async () => {
		const res = await request(app)
			.post('/generate')
			.send({})
			.set('Content-Type', 'application/json');
		expect(res.status).toBe(400);
		expect(res.body?.error).toBe('INVALID_INPUT');
	});

	it('POST /generate with quiz requires GEMINI_API_KEY (500 without key)', async () => {
		const originalKey = process.env.GEMINI_API_KEY;
		delete process.env.GEMINI_API_KEY;
		const res = await request(app)
			.post('/generate')
			.send({ quiz: 'Photosynthesis basics' })
			.set('Content-Type', 'application/json');
		// Restore immediately to avoid test bleed
		if (originalKey) process.env.GEMINI_API_KEY = originalKey;
		expect([500, 429]).toContain(res.status); // 500 if missing, 429 if rate limited in some envs
	});
});


