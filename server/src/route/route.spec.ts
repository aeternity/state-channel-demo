import { ChannelOptions } from '@aeternity/aepp-sdk/es/channel/internal';
import supertest from 'supertest';
import { app } from '../app';
import botService from '../services/bot';
import { mockChannel } from '../../test';

describe('/open', () => {
  jest.setTimeout(15000);
  mockChannel();

  it('retrieves channel configuration', async () => {
    const config = {
      address: 'ak_2fnsAzkXfvWKZJXx2bkPSWMtpBpfEXFhJpL9ThFLWMxQ7G9wag',
      port: 8000,
      host: 'localhost',
    };
    const res = await supertest(app)
      .post('/open')
      .send(config)
      .set('Accept', 'application/json');

    expect(res.status).toBe(200);
    const { initiatorId, ...rest } = res.body as ChannelOptions;
    expect(rest).toEqual({
      ...botService.mutualChannelConfiguration,
      port: config.port,
      host: config.host,
      gameStake: '10000000000000000',
      responderId: config.address,
      responderAmount:
        botService.mutualChannelConfiguration.responderAmount.toString(),
      initiatorAmount:
        botService.mutualChannelConfiguration.initiatorAmount.toString(),
    });
  });

  it('throws an error when port is not provided', async () => {
    const config = {
      address: 'ak_2fnsAzkXfvWKZJXx2bkPSWMtpBpfEXFhJpL9ThFLWMxQ7G9wag',
    };
    const res = await supertest(app)
      .post('/open')
      .send(config)
      .set('Accept', 'application/json');

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'port is required.' });
  });

  it('throws an error when address is not provided', async () => {
    const config = {
      port: 8000,
      host: 'localhost',
    };
    const res = await supertest(app)
      .post('/open')
      .send(config)
      .set('Accept', 'application/json');

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'address is required.' });
  });

  it('throws an error when host is not provided', async () => {
    const config = {
      address: 'ak_2fnsAzkXfvWKZJXx2bkPSWMtpBpfEXFhJpL9ThFLWMxQ7G9wag',
      port: 8000,
    };
    const res = await supertest(app)
      .post('/open')
      .send(config)
      .set('Accept', 'application/json');

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'host is required.' });
  });
});
