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

const orderHash = '0x...';


const args = {
  orderHash,
  nonce: nonce,
  address: wallet.address,
};
const raw = soliditySha3(
  {
    t: 'uint256',
    v: args.orderHash,
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

console.log('Cancel payload:');
console.log(JSON.stringify(Object.assign(args, vrs), null, 2));
