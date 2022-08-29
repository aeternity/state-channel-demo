import { generateKeyPair } from '@aeternity/aepp-sdk';
import axios, { AxiosError } from 'axios';
import { FAUCET_PUBLIC_ADDRESS } from './sdk.constants';
import { fundAccount, fundThroughFaucet } from './sdk.service';

const axiosSpy = jest.spyOn(axios, 'post');

jest.mock('./sdk.constants', () => ({
  ...jest.requireActual('./sdk.constants'),
  IS_USING_LOCAL_NODE: false,
}));

describe('fundThroughFaucet()', () => {
  const mockedAxios = axios as jest.Mocked<typeof axios>;
  const accountMock = generateKeyPair().publicKey;

  afterEach(() => {
    mockedAxios.post.mockClear();
  });

  it('should run without errors', async () => {
    mockedAxios.post.mockReturnValue(Promise.resolve());
    await fundThroughFaucet(accountMock);
  });

  it('should throw an error if faucet greylisted account', async () => {
    mockedAxios.post.mockRejectedValueOnce(
      new AxiosError('Greylisted', '425', null, null, {
        status: 425,
        statusText: 'Greylisted',
        headers: {},
        config: {},
        request: {},
        data: [],
      }),
    );
    await expect(fundThroughFaucet(accountMock)).rejects.toThrow();
    expect(axiosSpy).toHaveBeenCalledTimes(1);
  });

  it('should not throw an error if account has enough coins', async () => {
    mockedAxios.post.mockRejectedValue(
      new AxiosError('Greylist', '425', null, null, {
        status: 425,
        statusText: 'Greylist',
        headers: {},
        config: {},
        request: {},
        data: [],
      }),
    );

    await fundAccount(FAUCET_PUBLIC_ADDRESS);
    expect(axiosSpy).toHaveBeenCalledTimes(1);
  });
});
