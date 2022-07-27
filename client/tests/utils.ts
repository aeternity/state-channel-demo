import { Channel } from '@aeternity/aepp-sdk';

export async function waitForChannelReady(channel: Channel): Promise<void> {
  return new Promise((resolve) => {
    channel.on('statusChanged', (status: string) => {
      if (status === 'open') {
        resolve();
      }
    });
  });
}
