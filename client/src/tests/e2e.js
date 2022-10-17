import { expect, describe, it, beforeEach } from 'vitest';
import { gameChannel, GameChannel } from '../js/game-channel/game-channel';
import { sdk, getNewSdk, FAUCET_ACCOUNT } from '../js/sdk-service/sdk-service';
import { Window } from 'happy-dom';
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import { init } from '../../main';

global.fetch = fetch;

const html = fs.readFileSync(
  path.resolve(__dirname, '../../index.html'),
  'utf8'
);

const awaitDelay = (delay) =>
  new Promise((resolve) => setTimeout(resolve, delay));
const pollForOutcome = async () => {
  const statusText = document.querySelector('.status.title').textContent;
  const outcomes = ['Bot wins!', 'You win!', "It's a draw!"];
  const outcomeIsCorrect = outcomes.includes(statusText);
  if (!outcomeIsCorrect) {
    await awaitDelay(1000);
    return pollForOutcome();
  }
};

const autoplayButtonChangeDispatch = () => {
  global.document
    .getElementById('autoplay_button')
    .dispatchEvent(new Event('change'));
};

describe('e2e', async () => {
  beforeEach(async () => {
    // reset game session state
    Object.assign(gameChannel, new GameChannel());
    global.window = new Window();
    global.document = global.window.document;
    global.document.body.innerHTML = html;
    global.localStorage = global.window.localStorage;
    global.window.HTMLElement.prototype.scrollIntoView = function () {};
    await init();
  });

  it('creates game channel instance, initializes Channel and returns coins to faucet on channel closing', async () => {
    await gameChannel.initializeChannel();
    await new Promise((resolve) => setTimeout(resolve, 15000));
    const client = sdk;
    const ae = await getNewSdk();

    expect(client?.selectedAddress).toBeTruthy();
    expect(gameChannel.getStatus()).toBe('open');

    if (FAUCET_ACCOUNT) {
      await ae.addAccount(FAUCET_ACCOUNT, { select: true });
    }
    const balance_before = await client.getBalance(client.selectedAddress);
    expect(BigInt(balance_before)).toBeGreaterThan(0);

    const faucet_balance_before = await ae.getBalance(ae.selectedAddress);
    await new Promise((resolve) => setTimeout(resolve, 5000));

    await gameChannel.closeChannel();
    await new Promise((resolve) => setTimeout(resolve, 5000));
    expect(gameChannel.getStatus()).toBe('disconnected');

    const balance_after = await client.getBalance(client.selectedAddress);
    const faucet_balance_after = await ae.getBalance(ae.selectedAddress);
    expect(balance_after).toBe('0');
    expect(BigInt(faucet_balance_after)).toBeGreaterThan(
      BigInt(faucet_balance_before)
    );
  }, 30000);

  it(
    'e2e',
    async () => {
      expect(
        document
          .getElementById('check-explorer-btn')
          .classList.contains('disabled')
      ).toBe(true);
      expect(document.getElementById('end-game').disabled).toBe(true);
      document.querySelector('.selections button').click();
      await awaitDelay(50);

      const statusSelector = '.status.title';
      expect(document.querySelector(statusSelector).textContent).toBe(
        'Initializing channel...'
      );
      await pollForOutcome();
      // end of initialization & pick

      expect(document.querySelector('.selections').style.display).toBe('none');
      await awaitDelay(5000);
      expect(document.querySelector('.selections').style.display).toBe('flex');
      expect(document.querySelector('.round-index').textContent).toBe('2');
      // end of single round

      const logs = document.querySelector('.transactions-list').childNodes;
      expect(logs.length).toBe(7);
      expect(logs[0].textContent.includes('User initialized a Memory Account'));
      expect(logs[1].textContent.includes('User invited a bot'));
      expect(
        logs[2].textContent.includes('initialise state channel connection')
      );
      expect(logs[2].textContent.includes('User co-signed'));
      expect(logs[3].textContent.includes('deployed game contract'));
      expect(logs[3].textContent.includes('verified validity'));
      expect(logs[4].textContent.includes('hashed game move'));
      expect(logs[4].textContent.includes('contract call with game move'));
      expect(logs[5].textContent.includes('contract call with game move'));
      expect(
        logs[5].textContent.includes(
          'User co-signed a contract call with bot’s game move'
        )
      );
      expect(logs[6].textContent.includes('with revealed game move'));
      expect(
        logs[6].textContent.includes(
          'Bot co-signed user’s contract call with revealed'
        )
      );
      // end of logs

      gameChannel.restoreGameState(
        JSON.parse(window.localStorage.getItem('gameState'))
      );
      await awaitDelay(3000);
      expect(document.querySelector('#logs-notification').style.display).toBe(
        'flex'
      );
      // end of reconnect

      expect(
        document
          .getElementById('check-explorer-btn')
          .classList.contains('disabled')
      ).toBe(false);
      expect(document.getElementById('end-game').disabled).toBe(false);

      global.document.querySelector('#autoplay_button').checked = true;
      autoplayButtonChangeDispatch();
      expect(global.document.querySelector('.selections').style.display).toBe(
        'none'
      );
      await awaitDelay(8000);
      global.document.querySelector('#autoplay_button').checked = false;
      autoplayButtonChangeDispatch();
      await awaitDelay(8000);
      expect(
        parseInt(global.document.querySelector('.round-index').textContent)
      ).toBeGreaterThan(3);
      expect(global.document.querySelector('.selections').style.display).toBe(
        'flex'
      );
      expect(
        document.querySelector('.transactions-list').childNodes.length
      ).toBeGreaterThan(10);
      // end of autoplay

      document.getElementById('end-game').click();
      await awaitDelay(5000);
      expect(
        document.querySelector('#end-screen .title').textContent.includes('Æ')
      );
      expect(
        document.querySelector('#end-screen .title').textContent.includes('You')
      );

      expect(
        document
          .getElementById('check-explorer-btn')
          .classList.contains('disabled')
      ).toBe(false);
      expect(document.getElementById('end-game').disabled).toBe(true);
      // end of end-game screen
    },
    4 * 60000
  );
});
