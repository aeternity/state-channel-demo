import { describe, it, expect } from 'vitest';
import { getSdk } from '../src/sdk/sdk';

describe('getSdk', () => {
  it('creates and returns an SDK instance', async () => {
    const sdk = await getSdk();
    expect(sdk).toBeTruthy();
    expect(Object.keys(sdk.accounts).length).toBe(1);
    expect(sdk.selectedAddress).toBeTruthy();
  });
});
