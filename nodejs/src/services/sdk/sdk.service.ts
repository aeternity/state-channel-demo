import { Channel } from '@aeternity/aepp-sdk';

/**
 * A helper function which awaits the channel to be open
 * @param channel
 * @returns
 */
export async function waitForChannel(channel: Channel): Promise<void> {
  return new Promise((resolve) => {
    channel.on('statusChanged', (status: string) => {
      if (status === 'open') {
        resolve();
      }
    });
  });
}
