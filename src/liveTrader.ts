import axios from 'axios';
import { ethers } from 'ethers';

import CH_ABI from '../abi/ClearingHouse.json';
import ERC20_ABI from '../abi/ERC20.json';

export enum Side {
  BUY = 0, // long
  SELL, // short
}

export type Order = {
  id: string;
  amm: string;
  trader: string;
  price: number;
  size: number;
  side: number;
  timestamp: number;
};

export type LimitOrder = {
  id?: string;
  side: Side;
  price: number;
  amount: number;
};

export type Level = {
  price: number;
  size: number;
  side: number;
};

type Addresses = {
  clearingHouse: string;
  weth: string;
  amms: {
    [key: string]: string;
  };
};

class liveTrader {
  // Public variables
  signer: ethers.Wallet;
  PUBLIC_KEY: string;
  AMM_ADDRESS?: string;
  DOMAIN_NAME: string;
  ADDRESSES?: Addresses;
  clearingHouse?: ethers.Contract;
  amm: string;
  leverage: any;

  constructor(
    signer: ethers.Wallet,
    amm: string,
    leverage = 1,
    testnet = true
  ) {
    this.signer = signer;
    this.PUBLIC_KEY = signer.address;
    this.amm = amm;
    this.DOMAIN_NAME = testnet
      ? 'https://api.nftperp.xyz'
      : 'https://live.nftperp.xyz';
    this.leverage = ethers.utils.parseUnits(leverage.toString(), 18);
  }

  //initialize the contracts
  async initialize() {
    let res = await axios.get<{
      data: Addresses;
    }>(`${this.DOMAIN_NAME}/contracts`);
    this.ADDRESSES = res.data.data;
    this.clearingHouse = await new ethers.Contract(
      this.ADDRESSES.clearingHouse,
      CH_ABI.abi,
      this.signer
    );
    this.AMM_ADDRESS = this.ADDRESSES.amms[this.amm];
    return;
  }

  async checkApproval() {
    if (!this.ADDRESSES) {
      throw new Error('Not initialized');
    }

    const wethContract = new ethers.Contract(
      this.ADDRESSES.weth,
      ERC20_ABI.abi,
      this.signer
    );

    const allowance_if = await wethContract.allowance(
      this.signer.getAddress(),
      this.ADDRESSES.clearingHouse
    );

    if (allowance_if.lt(ethers.utils.parseEther('1000'))) {
      console.log('Approving spending to CH');
      await wethContract.approve(
        this.ADDRESSES.clearingHouse,
        ethers.constants.MaxUint256
      );
    }
  }

  async getPrice() {
    try {
      const res = await axios.get(
        `${this.DOMAIN_NAME}/markPrice?amm=${this.amm}`
      );
      return res.data.data;
    } catch (e) {
      return this.getIndexPrice();
    }
  }

  async getIndexPrice() {
    const res = await axios.get(
      `${this.DOMAIN_NAME}/indexPrice?amm=${this.amm}`
    );
    return res.data.data;
  }

  async getPosition() {
    const res = await axios.get(
      `${this.DOMAIN_NAME}/position?amm=${this.amm}&trader=${this.PUBLIC_KEY}`
    );
    return res.data.data;
  }

  async getPositionSize() {
    const position = await this.getPosition();
    return parseFloat(position.size) * parseFloat(position.markPrice);
  }

  async getBalance() {
    if (!this.ADDRESSES) {
      throw new Error('Not initialized');
    }
    const wethContract = new ethers.Contract(
      this.ADDRESSES.weth,
      ERC20_ABI.abi,
      this.signer
    );
    const wethBalanceWei = await wethContract.balanceOf(this.PUBLIC_KEY);
    const wethBalanceEth = ethers.utils.formatEther(wethBalanceWei);
    return wethBalanceEth;
  }

  async getETHBalance() {
    const balanceWei = await this.signer.getBalance();
    const balanceEth = ethers.utils.formatEther(balanceWei);
    return balanceEth;
  }

  async cancelAllLimitOrders() {
    if (!this.clearingHouse) {
      throw new Error('Not initialized');
    }
    const res = await axios.get(
      `${this.DOMAIN_NAME}/orders?amm=${this.amm}&trader=${this.PUBLIC_KEY}`
    );
    const orders = res.data.data;

    for (const order of orders) {
      const tx = await this.clearingHouse.deleteLimitOrder(String(order.id));
    }
  }

  async createLimitOrder(side: Side, price: number, amount: number) {
    if (!this.clearingHouse) {
      throw new Error('Not initialized');
    }

    for (var i = 0; i < 5; i++) {
      try {
        const order = {
          trader: this.PUBLIC_KEY,
          amm: this.AMM_ADDRESS,
          side,
          trigger: ethers.utils.parseUnits(price.toString(), 18),
          quoteAmount: ethers.utils.parseUnits(amount.toString(), 18),
          leverage: this.leverage,
          reduceOnly: false,
        };

        console.log({
          trader: this.PUBLIC_KEY,
          amm: this.AMM_ADDRESS,
          side,
          trigger: price.toString(),
          quoteAmount: amount.toString(),
          leverage: this.leverage,
          reduceOnly: false,
        });

        const tx = await this.clearingHouse.createLimitOrder(order);
        await tx.wait();

        return tx;
      } catch (e) {
        console.log('error', e);
        await new Promise((r) => setTimeout(r, 2000));
      }
    }
  }

  async createLimitOrders(orders: LimitOrder[]) {
    if (!this.clearingHouse) {
      throw new Error('Not initialized');
    }

    const allOrders = [];

    for (var i = 0; i < orders.length; i++) {
      const order = orders[i];

      if (order.amount > 0) {
        const curr_order = {
          trader: this.PUBLIC_KEY,
          amm: this.AMM_ADDRESS,
          side: order.side,
          trigger: ethers.utils.parseUnits(order.price.toString(), 18),
          quoteAmount: ethers.utils.parseUnits(order.amount.toString(), 18),
          leverage: this.leverage,
          reduceOnly: false,
        };

        allOrders.push(curr_order);
      }
    }

    for (var i = 0; i < 5; i++) {
      try {
        if (allOrders.length > 0) {
          const tx = await this.clearingHouse.createLimitOrderBatch(allOrders);
          await tx.wait();

          return tx;
        }
      } catch (e) {
        console.log('error', e);
        await new Promise((r) => setTimeout(r, 2000));
      }
    }
  }

  async updateLimitOrder(
    id: string,
    side: Side,
    price: number,
    amount: number
  ) {
    if (!this.clearingHouse) {
      throw new Error('Not initialized');
    }

    for (var i = 0; i < 5; i++) {
      try {
        const order = {
          trader: this.PUBLIC_KEY,
          amm: this.AMM_ADDRESS,
          side,
          trigger: ethers.utils.parseUnits(price.toString(), 18),
          quoteAmount: ethers.utils.parseUnits(amount.toString(), 18),
          leverage: this.leverage,
          reduceOnly: false,
        };

        console.log('update', id, {
          trader: this.PUBLIC_KEY,
          amm: this.AMM_ADDRESS,
          side,
          trigger: price.toString(),
          quoteAmount: amount.toString(),
          leverage: this.leverage,
          reduceOnly: false,
        });

        const tx = await this.clearingHouse.updateLimitOrder(id, order);
        await tx.wait();

        return tx;
      } catch (e) {
        console.log('error', e);
        await new Promise((r) => setTimeout(r, 2000));
      }
    }
  }

  async updateLimitOrders(orders: LimitOrder[]) {
    if (!this.clearingHouse) {
      throw new Error('Not initialized');
    }

    let ids = [];
    let allOrders = [];

    for (var i = 0; i < orders.length; i++) {
      if (orders[i].amount > 0) {
        const order = {
          trader: this.PUBLIC_KEY,
          amm: this.AMM_ADDRESS,
          side: orders[i].side,
          trigger: ethers.utils.parseUnits(orders[i].price.toString(), 18),
          quoteAmount: ethers.utils.parseUnits(orders[i].amount.toString(), 18),
          leverage: this.leverage,
          reduceOnly: false,
        };

        allOrders.push(order);
        ids.push(orders[i].id);
      }
    }

    for (var i = 0; i < 5; i++) {
      try {
        if (allOrders.length > 0) {
          const tx = await this.clearingHouse.updateLimitOrderBatch(
            ids,
            allOrders
          );
          await tx.wait();

          return tx;
        } else {
          return;
        }
      } catch (e) {
        console.log('error', e);
        await new Promise((r) => setTimeout(r, 2000));
      }
    }
  }

  async cancelLimitOrder(side: Side, price: number) {
    if (!this.clearingHouse) {
      throw new Error('Not initialized');
    }

    const res = await axios.get<{
      data: Order[];
    }>(`${this.DOMAIN_NAME}/orders?amm=${this.amm}&trader=${this.PUBLIC_KEY}`);
    const orders = res.data.data;

    for (const order of orders) {
      if (order.side === side && order.price === price) {
        const tx = await this.clearingHouse.deleteLimitOrder(String(order.id));
        await tx.wait();
        return tx;
      }
    }
  }

  async cancelOrder(orderId: string) {
    if (!this.clearingHouse) {
      throw new Error('Not initialized');
    }

    console.log('Cancelling', String(orderId));
    const tx = await this.clearingHouse.deleteLimitOrder(String(orderId));
    await tx.wait();
    return tx;
  }

  async sumBuyAndSellOrders() {
    const res = await axios.get<{
      data: Order[];
    }>(`${this.DOMAIN_NAME}/orders?amm=${this.amm}&trader=${this.PUBLIC_KEY}`);
    const orders = res.data.data;

    let buySum = 0;
    let sellSum = 0;

    for (const order of orders) {
      if (order.side === 0) {
        buySum += order.size * order.price;
      } else {
        sellSum += order.size * order.price;
      }
    }

    return { buySum, sellSum };
  }

  async cancelOrders(ids: string[]) {
    if (!this.clearingHouse) {
      throw new Error('Not initialized');
    }

    for (var i = 0; i < 5; i++) {
      try {
        const tx = await this.clearingHouse.deleteLimitOrderBatch(ids);
        await tx.wait();
        return tx;
      } catch (e) {
        console.log('error', e);
        await new Promise((r) => setTimeout(r, 2000));
      }
    }
  }

  async getMyOrders() {
    const res = await axios.get<{
      data: Order[];
    }>(`${this.DOMAIN_NAME}/orders?amm=${this.amm}&trader=${this.PUBLIC_KEY}`);
    const allOrders = res.data.data;

    const buyOrders = allOrders
      .filter((order) => order.side === 0)
      .sort((a, b) => a.price - b.price); // Sort by price in ascending order for buy orders

    const sellOrders = allOrders
      .filter((order) => order.side === 1)
      .sort((a, b) => b.price - a.price); // Sort by price in descending order for sell orders

    return { buyOrders, sellOrders };
  }

  async getOrders() {
    const res = await axios.get<{ data: { levels: Level[] } }>(
      `${this.DOMAIN_NAME}/orderbook?amm=${this.amm}`
    );
    const allOrders = res.data.data.levels;

    const buyOrders = allOrders
      .filter((order) => order.side === 0)
      .sort((a, b) => a.price - b.price); // Sort by price in ascending order for buy orders

    const sellOrders = allOrders
      .filter((order) => order.side === 1)
      .sort((a, b) => b.price - a.price); // Sort by price in descending order for sell orders

    return { buyOrders, sellOrders };
  }
}

export default liveTrader;
