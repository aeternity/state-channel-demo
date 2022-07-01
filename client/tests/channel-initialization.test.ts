import { render, fireEvent } from '@testing-library/vue';
import { describe, it, expect, vi } from 'vitest';
import ChannelInitialization from '../src/components/ChannelInitialization.vue';

describe('Open State Channel Button', () => {
  expect(ChannelInitialization).toBeTruthy();
  it('should disable button after clicking it and open channel', async () => {
    const channelComp = render(ChannelInitialization);
    const button = channelComp.getByText('Open State Channel');
    await fireEvent.click(button);
    // button is disabled after clicking it
    expect(button.getAttribute('disabled')).toBe('true');

    // Channel Status is shown after clicking button
    channelComp.getByText('Channel Status: getting channel config');

    // Channel Status becomes "open" after initialization is complete
    await new Promise((resolve) => setTimeout(resolve, 22000));
    channelComp.getByText('Channel Status: open');
  }, 23000);

  it('shows error message on error', async () => {
    vi.stubGlobal('fetch', () =>
      Promise.resolve({
        ok: false,
        json: () =>
          Promise.resolve({
            error: 'error',
          }),
      })
    );

    const channelComp = render(ChannelInitialization);
    const button = channelComp.getByText('Open State Channel');
    await fireEvent.click(button);
    await new Promise((resolve) => setTimeout(resolve, 200));
    expect(
      channelComp.getByText('Error: Error while fetching channel config')
    ).toBeTruthy();
  });
});
