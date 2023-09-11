# NFTPerp Trader
NFTPerp trader is a pure javascript library that streamlines the process of trading on the NFTPerp Platform. The [NFTPerp Maker](https://github.com/nftperp/nftperp-maker) repo uses this script to market make on NFTPerp.

## Example
The [NFTPerp Maker](https://github.com/nftperp/nftperp-maker) repo that uses this library is production ready and was used to market make on the paper trading platform.

## Install

> npm i @nftperp/trader

## Tests
Copy .env-example and create .env. Once the environment variables are set, you can perform integration tests with:

> npm test

## Getting Started

The liveTrader can be instantiated as below:

    const liveTrader = require('@nftperp/trader');
    let lt = new liveTrader(signer, amm, leverage=1, testnet = true);

**Parameters:**

    signer: An Ethereum signer.
    amm: Denotes the chosen market.
    leverage: The leverage trader is willing to use, with a default of 1.
    testnet: A boolean flag indicating if the system operates in testnet mode (default is true).

It contains the following method:

**1. initialize()**

Sets up contract addresses and initializes the ClearingHouse contract.

    Parameters: None.
    Return: void.

**2. getPrice()**

Fetches the current mark price for the chosen market.

    Parameters: None.
    Return: float - representing the markPrice.

**3. getIndexPrice()**

Fetches the current index price for the selected market.

    Parameters: None.
    Return: float - representing the indexPrice.

**4. getPosition()**

Retrieves the trader's position in the given market

    Parameters: None.
    Return: Object representing the trader's position

**5. getPositionSize()**

Retrieves the size of the trader's position at the market price.

    Parameters: None.
    Return: float - representing the position size.


**6. getBalance()**

Obtains the WETH balance associated with the trader's address

    Parameters: None.
    Return: float  - balance in ETH format.

**7. getETHBalance()**

Queries the Ethereum balance of the trader's address

    Parameters: None.
    Return: float - balance in ETH format.

**8. cancelAllLimitOrders()**

Cancels all of the trader's limit orders in the chosen market

    Parameters: None.
    Return: void

**9. createLimitOrder(side, price, amount)**

Sets up a limit order based on the provided criteria.

    Parameters: 
        side: String ("LONG" or "SHORT") to indicate order direction.
        price: Numeric value for the desired order price.
        amount: Numeric value for the order amount.
    
    Return: Transaction object.

**10. updateLimitOrder(id, side, price, amount)**

Modifies an existing limit order based on its ID and provided parameters.

    Parameters: 
        id: Order ID to be updated.
        side: String ("LONG" or "SHORT") to indicate order direction.
        price: Numeric value for the desired order price.
        amount: Numeric value for the order amount.
    
    Return: Transaction object.

**11. cancelLimitOrder(side, price)**

Cancels a specified limit order based on its side and price.

    Parameters: 
        side: String indicating order side.
        price: Numeric value indicating order price.

    Return: Transaction object

**12. cancelOrder(orderId)**

Cancels a specified limit order based on its id

    Parameters: 
        orderId: ID of the order to be canceled.

    Return: Transaction object

**13. sumBuyAndSellOrders()**

Aggregates the value of all of the trader's buy and sell orders.

    Parameters: None.
    Return: Object with properties buySum and sellSum indicating the totals.

**14. getMyOrders()**

Fetches the trader's orderbook, segmented into buy and sell orders.

    Parameters: None.
    Return: Object containing arrays buyOrders and sellOrders, sorted by price.

**15. getOrders()**

Retrieves the entire orderbook, segmented into buy and sell orders.

    Parameters: None.
    Return: Object containing arrays buyOrders and sellOrders, sorted by price.
