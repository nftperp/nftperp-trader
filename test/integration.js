const liveTrader = require('../liveTrader');
const { ethers } = require("ethers");
const axios = require('axios');
const assert = require('assert'); 

require("dotenv").config();

describe('Arbitrum Tests', () => {
    let lt

    before(async () => {

        let provider = new ethers.providers.AlchemyProvider(
            'arbitrum',
            process.env.ALCHEMY_KEY
        );

        let signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

        lt = new liveTrader(signer, 'bayc', leverage=1, testnet=true);
        await lt.initialize();
    });

    it('Initialization', async () => {
        assert.strictEqual(lt.ADDRESSES.clearingHouse, '0x8f940C5A2be8ee72487CB5E257a6DE54DBbfD9DD');
        assert.strictEqual(lt.ADDRESSES.insuranceFund, '0xe70Ad23d0171de72c9015212359A1Fe1Cd30Ff35');
        assert.strictEqual(lt.ADDRESSES.priceFeed, '0xBe1296C9062DA7B2Eac8EF85C4e124C821619255');
        assert.strictEqual(lt.ADDRESSES.whitelist, '0xB9433D4E49E8C90ee5616aD1eE78a5Ba141Fd370');
        assert.strictEqual(lt.ADDRESSES.amms.bayc, '0xc7cA02aa95EBcCeBC098A4C0a07de0CDa110036b');
        assert.strictEqual(lt.AMM_ADDRESS, '0xc7cA02aa95EBcCeBC098A4C0a07de0CDa110036b');
    })

    it ('Get Mark Price', async () => {
        const price = await lt.getPrice();
        assert(price > 1, `Expected price to be greater than 1, but got ${price}`);
        assert(price < 1000, `Expected price to be less than 1000, but got ${price}`);
    })

    it ('Get getIndexPrice', async () => {
        const price = await lt.getIndexPrice();
        assert(price > 1, `Expected price to be greater than 1, but got ${price}`);
        assert(price < 1000, `Expected price to be less than 1000, but got ${price}`);
    })
})