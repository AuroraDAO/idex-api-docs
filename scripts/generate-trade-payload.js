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
  address: '0xf542630af7e57A1CF11c3aE597249e9755630571',
  privateKey: '0x...',
};

/**
 * https://api.idex.market/returnNextNonce?address=...
 */
const nonce = 35;

/**
 * Copy and paste an order object from any of the order endpoints
 */
const openOrder = {
  'orderNumber': 447055,
  'orderHash': '0xd3192d7eabfc5784af598ebe694a0bc3cbe48da57b53325fd2b2f293264845a8',
  'timestamp': 1543970518,
  'price': '15',
  'amount': '0.01',
  'total': '0.15',
  'type': 'sell',
  'params': {
    'tokenBuy': '0x0000000000000000000000000000000000000000',
    'buyPrecision': 18,
    'amountBuy': '150000000000000000',
    'tokenSell': '0x0b243e93c5f4c432f74aa785cc67da2ab9357f2b',
    'sellPrecision': 18,
    'amountSell': '10000000000000000',
    'expires': 100000,
    'nonce': 6,
    'user': '0x5c1c99b3949fd070470d70329d20ab19e71b14c5',
  },
};

/**
 * If not filling the order in full, specify the amount here.
 * Expressed in the currency you are paying with (tokenBuy/amountBuy).
 */
const purchaseAmount = openOrder.params.amountBuy;
// const purchaseAmount = '150000000000000000';

/**
 * Validate configuration
 */
if (
  !wallet.address
  || !wallet.privateKey
  || wallet.privateKey === '0x...'
  || (!nonce && nonce !== 0)
  || !purchaseAmount
  || !openOrder.orderHash
) {
  console.log('Invalid configuration. Please make sure all input variables are set.')
  return;
}


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
