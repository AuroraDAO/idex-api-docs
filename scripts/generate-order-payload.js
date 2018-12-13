const { soliditySha3 } = require('web3-utils');
const {
  hashPersonalMessage,
  bufferToHex,
  toBuffer,
  ecsign,
} = require('ethereumjs-util');
const { mapValues } = require('lodash');

/**
 * https://api.idex.market/returnContractAddress
 */
const idexContractAddress = '0x2a0c0dbecc7e4d658f48e01e3fa353f44050c208';

/**
 * Your wallet's address and private key
 */
const wallet = {
  address: '0x5c1c99b3949fd070470d70329d20ab19e71b14c5',
  privateKey: '0x...',
};

/**
 * https://api.idex.market/returnNextNonce?address=...
 */
const nonce = 6;

const tokenBuy = '0x0000000000000000000000000000000000000000'; // ETH
const amountBuy = '150000000000000000'; // 0.15 ETH (IDEX's minimum)
const tokenSell = '0x0b243e93c5f4c432f74aa785cc67da2ab9357f2b'; // DIL
const amountSell = '10000000000000000'; // 1/100th of a coin

/**
 * Validate configuration
 */
if (
  !idexContractAddress
  || !wallet.address
  || !wallet.privateKey
  || wallet.privateKey === '0x...'
  || (!nonce && nonce !== 0)
  || !tokenBuy
  || !amountBuy
  || !tokenSell
  || !amountSell
) {
  console.log('Invalid configuration. Please make sure all input variables are set.')
  return;
}


const args = {
  tokenBuy,
  amountBuy,
  tokenSell,
  amountSell,
  address: wallet.address,
  nonce,
  expires: 100000,
};
const raw = soliditySha3(
  {
    t: 'address',
    v: idexContractAddress,
  },
  {
    t: 'address',
    v: args.tokenBuy,
  },
  {
    t: 'uint256',
    v: args.amountBuy,
  },
  {
    t: 'address',
    v: args.tokenSell,
  },
  {
    t: 'uint256',
    v: args.amountSell,
  },
  {
    t: 'uint256',
    v: args.expires,
  },
  {
    t: 'uint256',
    v: args.nonce,
  },
  {
    t: 'address',
    v: args.address,
  },
);
const salted = hashPersonalMessage(toBuffer(raw));
const vrs = mapValues(
  ecsign(salted, toBuffer(wallet.privateKey)),
  (value, key) => key === 'v' ? value : bufferToHex(value),
);

console.log('Order payload:');
console.log(JSON.stringify(Object.assign(args, vrs), null, 2));
