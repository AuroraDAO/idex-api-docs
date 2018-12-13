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
  address: '0x5c1c99b3949fd070470d70329d20ab19e71b14c5',
  privateKey: '0x...',
};

/**
 * https://idex.market/returnNextNonce?address=...
 */
const nonce = 5;

const orderHash = '0x0d326989c139b3ce0bb1bc3c35b4677b2236af72406c0589fe06c34b00097033';


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
