const { soliditySha3 } = require('web3-utils');
const {
  hashPersonalMessage,
  bufferToHex,
  toBuffer,
  ecsign,
} = require('ethereumjs-util');
const { mapValues } = require('lodash');


/**
 * Your wallet's address and private key
 */
const wallet = {
  address: '0x...',
  privateKey: '0x...',
};

/**
 * https://api.idex.market/returnNextNonce?address=...
 */
const nonce = 123;

/**
 * Copy and paste an order object from any of the order endpoints
 */
const openOrder = {
  price:	'0.00019293',
  amount:	'9999.9999999999996543',
  total:	'1.9293',
  orderHash:	'0x...',
  params: {
    tokenBuy:	'0x0000000000000000000000000000000000000000',
    buySymbol:	'ETH',
    buyPrecision:	18,
    amountBuy:	'1929300000000000000',
    tokenSell:	'0xcdcfc0f66c522fd086a1b725ea3c0eeb9f9e8814',
    sellSymbol:	'AURA',
    sellPrecision:	18,
    amountSell:	'9999999999999999654300',
    expires:	10000,
    nonce:	648943716,
    user:	'0x...',
  },
};

/**
 * If not filling the order in full, specify the amount here.
 * Expressed in the currency you are paying with (tokenBuy/amountBuy).
 */
const purchaseAmount = openOrder.params.amountBuy;
// const purchaseAmount = '150000000000000000';


const args = {
  orderHash: openOrder.orderHash,
  amount: purchaseAmount,
  nonce,
  address: wallet.address,
};
const raw = soliditySha3(
  {
    t: 'uint256',
    v: args.orderHash,
  },
  {
    t: 'uint256',
    v: args.amount,
  },
  {
    t: 'address',
    v: args.address,
  },
  {
    t: 'uint256',
    v: args.nonce,
  },
);
const salted = hashPersonalMessage(toBuffer(raw));
const vrs = mapValues(
  ecsign(salted, toBuffer(wallet.privateKey)),
  (value, key) => key === 'v' ? value : bufferToHex(value),
);

console.log('Trade payload:');
console.log(JSON.stringify(Object.assign(args, vrs), null, 2));
