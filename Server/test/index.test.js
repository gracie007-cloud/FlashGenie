import request from 'supertest';
import app from '../src/index';

describe('POST /generate', () => {
  it('should return a 200 response for a valid text prompt', async () => {
    const response = await request(app)
      .post('/generate')
      .send({ quiz: 'What is the capital of France?' });
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
    // Check that each flashcard has question and answer
    if (response.body.length > 0) {
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('question');
      expect(response.body[0]).toHaveProperty('answer');
    }
  });

  it('should return a 200 response for a valid image prompt', async () => {
    const imageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wcAAwAB/epv2AAAAABJRU5ErkJggg==';
    const response = await request(app)
      .post('/generate')
      .send({ imageBase64, quiz: 'what color is this?' });
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
    // Check that each flashcard has question and answer
    if (response.body.length > 0) {
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('question');
      expect(response.body[0]).toHaveProperty('answer');
    }
  });

  it('should return a 400 response for an invalid request', async () => {
    const response = await request(app)
      .post('/generate')
      .send({});
    expect(response.status).toBe(400);
  });
});
