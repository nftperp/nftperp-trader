import { assert } from 'chai';
import { ethers } from 'ethers';

import liveTrader from '../src/liveTrader';

require('dotenv').config();

describe('Arbitrum Tests', () => {
  let lt;

  before(async () => {
    let provider = new ethers.providers.AlchemyProvider(
      'arbitrum',
      process.env.ALCHEMY_KEY
    );

    let signer = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);

    lt = new liveTrader(signer, 'bayc', 1, true);
    await lt.initialize();
  });

  it('Get Mark Price', async () => {
    const price = await lt.getPrice();
    assert(price > 1, `Expected price to be greater than 1, but got ${price}`);
    assert(
      price < 1000,
      `Expected price to be less than 1000, but got ${price}`
    );
  });

  it('Get getIndexPrice', async () => {
    const price = await lt.getIndexPrice();
    assert(price > 1, `Expected price to be greater than 1, but got ${price}`);
    assert(
      price < 1000,
      `Expected price to be less than 1000, but got ${price}`
    );
  });
});
