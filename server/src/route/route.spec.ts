import { Channel } from '@aeternity/aepp-sdk';
import { ChannelOptions } from '@aeternity/aepp-sdk/es/channel/internal';
import { Encoded } from '@aeternity/aepp-sdk/es/utils/encoder';
import supertest from 'supertest';
import { mockChannel } from '../../test';
import { app } from '../app';
import env from '../env';
import { MUTUAL_CHANNEL_CONFIGURATION } from '../services/bot';
import { addGameSession, removeGameSession } from '../services/bot/bot.service';
import { ContractService, RockPaperScissorsContract } from '../services/contract';

const config: {
  address: Encoded.AccountAddress;
  port: number;
  host: string;
} = {
  address: 'ak_2fnsAzkXfvWKZJXx2bkPSWMtpBpfEXFhJpL9ThFLWMxQ7G9wag',
  port: 8000,
  host: 'localhost',
};

const deployContractSpy = jest.spyOn(ContractService, 'deployContract');

describe('/status', () => {
  async function fetchStatus() {
    return supertest(app).get('/status').set('Accept', 'application/json');
  }

  it('returns 0 as default values', async () => {
    const res = await fetchStatus();
    const currentDate = new Date();

    expect(res.status).toBe(200);
    expect(
      currentDate.getMilliseconds()
        - new Date(res.body.runningSince as number).getMilliseconds(),
    ).toBeLessThan(1000);
    expect(res.body).toEqual({
      channelsOpenCurrently: 0,
      channelsInitialized: 0,
      channelsOpened: 0,
      runningSince: expect.any(Number),
      lastReset: expect.any(Number),
      env: {
        ...env.development,
      },
    });
  });

  it('increments channels', async () => {
    await supertest(app)
      .post('/open')
      .send(config)
      .set('Accept', 'application/json');

    const initialRes = await fetchStatus();

    expect(initialRes.body.channelsInitialized).toBe(1);
    expect(initialRes.body.channelsOpened).toBe(0);
    expect(initialRes.body.channelsOpenCurrently).toBe(0);

    deployContractSpy.mockResolvedValue({
      instance: {} as RockPaperScissorsContract,
      address: 'ct_2fnsAzkXfvWKZJXx2bkPSWMtpBpfEXFhJpL9ThFLWMxQ7G9wag',
    });
    await addGameSession(
      {
        balances: jest.fn,
        state: jest.fn,
        poi: jest.fn,
        id: jest.fn,
        fsmId: jest.fn,
        disconnect: jest.fn,
      } as unknown as Channel,
      {
        initiatorId: config.address,
        responderId: 'ak_2fnsAzkXfvWKZJXx2bkPSWMtpBpfEXFhJpL9ThFLWMxQ7G9waz',
      } as unknown as ChannelOptions,
    );

    const res = await fetchStatus();

    const currentDate = new Date();

    expect(res.status).toBe(200);
    expect(
      currentDate.getMilliseconds()
        - new Date(res.body.runningSince as number).getMilliseconds(),
    ).toBeLessThan(1000);
    expect(res.body).toEqual({
      channelsOpenCurrently: 1,
      channelsInitialized: 1,
      channelsOpened: 1,
      runningSince: expect.any(Number),
      lastReset: expect.any(Number),
      env: {
        ...env.development,
      },
    });
  });

  it('decrements channels', async () => {
    removeGameSession(config.address);

    const res = await supertest(app)
      .get('/status')
      .set('Accept', 'application/json');

    expect(res.body.channelsOpenCurrently).toBe(0);
    expect(res.body.channelsOpened).toBe(1);
    expect(res.body.channelsInitialized).toBe(1);
  });

  it('resets stats', async () => {
    const initialStatus = await supertest(app)
      .get('/status')
      .set('Accept', 'application/json');

    const res = await supertest(app)
      .post('/status')
      .set('Accept', 'application/json')
      .set(
        'Authorization',
        `Authorization ${Buffer.from(
          ` :${process.env.BOT_SERVICE_STAT_RESET_PASSWORD}`,
        ).toString('base64')}`,
      );

    expect(res.body.lastReset).toBeGreaterThan(
      initialStatus.body.lastReset as number,
    );
    expect(res.body.runningSince).toBe(initialStatus.body.runningSince);
    expect(res.body.env).toEqual(res.body.env);
    expect(res.body.channelsOpenCurrently).toBe(0);
    expect(res.body.channelsOpened).toBe(0);
    expect(res.body.channelsInitialized).toBe(0);
  });

  it('fails to restart stats if not authenticated', async () => {
    const res = await supertest(app)
      .post('/status')
      .set('Accept', 'application/json')
      .set(
        'Authorization',
        `Authorization ${Buffer.from(' :test').toString('base64')}`,
      );

    expect(res.status).toBe(401);
    expect(res.text).toBe('Access forbidden');
  });
});

describe('/open', () => {
  jest.setTimeout(15000);
  mockChannel();

  it('retrieves channel configuration', async () => {
    const res = await supertest(app)
      .post('/open')
      .send(config)
      .set('Accept', 'application/json');

    expect(res.status).toBe(200);
    const { initiatorId, ...rest } = res.body as ChannelOptions;
    expect(rest).toEqual({
      ...MUTUAL_CHANNEL_CONFIGURATION,
      port: config.port,
      host: config.host,
      gameStake: '10000000000000000',
      fee: '300000000000000000',
      responderId: config.address,
      responderAmount: MUTUAL_CHANNEL_CONFIGURATION.responderAmount.toString(),
      initiatorAmount: MUTUAL_CHANNEL_CONFIGURATION.initiatorAmount.toString(),
      channelReserve: MUTUAL_CHANNEL_CONFIGURATION.channelReserve.toString(),
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
