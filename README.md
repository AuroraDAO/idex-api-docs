# idex-api-docs

This repository contains instructions on how to consume the IDEX API. The IDEX API is under active development but methods documented here will not be deprecated and are safe to build upon. At this stage the only functionality ready for use is the necessary API call for coinmarketcap to read market data from the exchange.

## HTTP API

The HTTP API is available via https://api.idex.market

The name of the method call shall be the path of the URL, i.e. https://api.idex.market/returnTicker to use the returnTicker endpoint

All HTTP endpoints in the public API use POST. Message payloads, if they are included, must be in JSON format. The API will likewise return JSON. The public HTTP API currently contains one method.

### returnTicker

Designed to behave similar to the API call of the same name provided by the Poloniex HTTP API, with the addition of highs and lows. Returns all necessary 24 hr data.

Possible JSON encoded parameters:

* market - If included, this shall be the base market followed by an underscore, followed by the trade market. If omitted, will return an object of all markets

Sample code:

```js
const request = require('request');
request({
  method: 'POST',
  url: 'https://api.idex.market/returnTicker',
  json: {
    market: 'ETH_SAN'
  }
}, function (err, resp, body) {
  console.log(body);
})
```

Output for sample code would be of the following structure:

```js
{ last: '0.000981',
  high: '0.0010763',
  low: '0.0009777',
  lowestAsk: '0.00098151',
  highestBid: '0.0007853',
  percentChange: '-1.83619353',
  baseVolume: '7.3922603247161',
  quoteVolume: '7462.998433' }
```

To get data across all possible markets, use the same endpoint but omit the `market` parameter in the JSON payload. The object returned will be of the following structure:

```js
{
  ETH_SAN: 
   { last: '0.000981',
     high: '0.0010763',
     low: '0.0009777',
     lowestAsk: '0.00098151',
     highestBid: '0.0007853',
     percentChange: '-1.83619353',
     baseVolume: '7.3922603247161',
     quoteVolume: '7462.998433' },
  ETH_LINK: 
   { last: '0.001',
     high: '0.0014',
     low: '0.001',
     lowestAsk: '0.002',
     highestBid: '0.001',
     percentChange: '-28.57142857',
     baseVolume: '13.651606265667369466',
     quoteVolume: '9765.891979953083752189' }
  // all possible markets follow ...
}
```

Please note: If any field is unavailable due to a lack of trade history or a lack of 24hr data, the field will be set to `'N/A'`. `percentChange`, `baseVolume`, and `quoteVolume` will never be `'N/A'` but may be 0.

### Errors

If an error is returned from the API, it will be in the form of a simple object containing an `error` property whose value is the error message.

Example:

```js
{ error: 'Market ETH_BTC not found' }
```

## Further work

* WebSocket-enabled push API using pub/sub structure
* Subscribe to individual markets, orderbook changes, ticker changes, new trade data
* Set your DVIP enabled rewards multiplier or fee discount
* Create/cancel orders, perform market orders, perform limit orders
* Trollbox access
* Chart data
* Withdraw to your Ethereum wallet
* Retrieve info on transactions queued for dispatch
* And much more ...
