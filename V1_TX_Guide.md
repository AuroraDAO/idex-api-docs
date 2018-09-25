# IDEX Exchange Contract v1 TX Guide

This is a document to explain the possible transactions of IDEX for those who wish to measure trading volume, contained balances, and other information about traders directly from transaction data. If you only want to calculate things such as 24H trade volume or deposits and withdrawals you can also do so from the [IDEX API](https://github.com/AuroraDAO/idex-api-docs).

If for any reason you don't want to use the API, the below is an explanation for how to gather certain data from the chain.

You can find the [ABI for interfacing with IDEX here.](https://etherscan.io/address/0x2a0c0dbecc7e4d658f48e01e3fa353f44050c208#code)

## Trade Volume

If you would like to gather trade volume, the main function you should look for transactions of is the `trade(uint256[8] tradeValues, address[4] tradeAddresses, uint8[2] v, bytes32[4] rs)` function. When a user makes or takes an order, this is the function that is called. Although keep in mind there are no formal transfers through the token or in ETH, the only transfers that occur are when a user deposits or withdraws funds.

**Note:** 24-hour volume is also obtainable through [the IDEX API](https://github.com/AuroraDAO/idex-api-docs).

If you've seen the trade function before, you'll notice there are quite a lot of arrays. The smart contract code on EtherScan has a brief runthrough of what the arrays represent (line 146-161):

```
\* amount is in amountBuy terms \*
\* tradeValues
    [0] amountBuy entire buy amount of order
    [1] amountSell entire sell amount of order
    [2] expires block where order expires
    [3] nonce of the maker order
    [4] amount of the order being bought for (must be \&lt;= amountBuy)
    [5] tradeNonce nonce of the taker
    [6] feeMake fee as a proportion of 1 ether, in units of tokenBuy
    [7] feeTake fee as a proportion of 1 ether, in units of tokenSell
  tradeAddressses
    [0] tokenBuy address of the token bought by the maker
    [1] tokenSell address of the token sold by the taker
    [2] maker account address of the maker
    [3] taker account address of the taker
  v
    [0] maker v from signature
    [1] taker v from signature
  rs
    [0] maker r from signature
    [1] maker s from signature
    [2] taker r from signature
    [3] taker s from signature
*/
```

While everything is summarized here, you can find an [in-depth explanation in this gist.](https://gist.github.com/raypulver/2f318db5dc497cab8019d3ae391af1d2#file-trade-fields-md)

Although the signature values are important to the contract, you shouldn't be needing them for any trade specific calculations.

So if you wish to calculate trade volume in ETH, it's important to check if ETH is the buy or sell token due to its possibility of being either. And then pick out the `amount` value from the contract (which is in units of the buying token) and calculate it into ETH terms if ETH is not the buying token.
The paraphrased code below shows what calculations are made (line 174-180):

```
tokens[tokenBuy][taker] -= amount;
tokens[tokenBuy][maker] += safeMul(amount, (1 ether - feeMake)) / (1 ether);
tokens[tokenBuy][feeAccount] += safeMul(amount, feeMake) / (1 ether);
tokens[tokenSell][maker] -= safeMul(amountSell, amount) / amountBuy;
tokens[tokenSell][taker] += safeMul(safeMul(1 ether - feeTake, amountSell), amount) / amountBuy / (1 ether);
tokens[tokenSell][feeAccount] += safeMul(safeMul(feeTake, amountSell), amount) / amountBuy / (1 ether));
```

As shown above, if you would like to get the trading volume you can simply set the amount exchanged in a given trade to the amount variable from the transaction if the buying token is ETH.
However, if the buying token is not ETH (which means the selling token is ETH instead), you will need to convert the amount to in terms of `tokenSell` (ETH) by performing `amountSell` \* ( `amount` / `amountBuy`) in order to bring amount into tokenSell terms. That result will be the total amount traded in ETH.

**Note:** ETH is referred to in the contract as a token with a 0x0 address, please verify the amount you're calculating is from this 0x0 address because trades in the future may be with other token as a base such as DAI or other base pairs IDEX may add.

**Keep in mind:** all trade values and amounts are in pure `uint256` values, meaning there is no decimal math calculated. 0.0001 ETH = 100000000000000, but 1 IDXM = 100000000. You can get a [list of tokens and their decimals from the IDEX API](https://github.com/AuroraDAO/idex-api-docs#returncurrencies).

Total fees can also be calculated using that info above, specifically using the additions to the fee account.

Only trades that are matched are broadcasted to the network, so only matched trades are counted as transactions which means there's no need to check if orders are taken.

## Total Deposits

For the Deposits there are a few functions to monitor for:

```
function depositToken(address token, uint256 amount) {
  tokens[token][msg.sender] = safeAdd(tokens[token][msg.sender], amount);
  lastActiveTransaction[msg.sender] = block.number;
  if (!Token(token).transferFrom(msg.sender, this, amount)) throw;
  Deposit(token, msg.sender, amount, tokens[token][msg.sender]);
}
```

For `depositToken(address token, uint256 amount)`: It is specifically for ERC20 compliant token deposits. The `token` address and `amount` being deposited are passed in, added to the user balance for the token and then deposit event is emitted. Tracking the calls to this function will give you the tokens deposited.

```
function deposit() payable {
  tokens[address(0)][msg.sender] = safeAdd(tokens[address(0)][msg.sender], msg.value);
  lastActiveTransaction[msg.sender] = block.number;
  Deposit(address(0), msg.sender, msg.value, tokens[address(0)][msg.sender]);
}
```

Now for `deposit()`, it is for specifically ETH deposits (In the smart contract ETH is marked as a 0x0 address). It is a payable function where the value of the TX is added to the exchange balance, and the deposit event it emitted. Tracking the calls to this function will give you the ETH deposited.

## Total Withdrawals

For the Withdrawals there are a few functions to watch for:

**Notice:** These functions both handle _ETH_ and _ERC20_ at once. If the _token_ value is set to the 0x0 address, it will withdraw ETH, and if it is a actual token address it will withdraw that specific token. Remember to maintain decimals after retrieving the data or when you display it so numbers are accurate.

```
function withdraw(address token, uint256 amount) returns (bool success) {
    if (safeSub(block.number, lastActiveTransaction[msg.sender]) \&lt; inactivityReleasePeriod) throw;
    if (tokens[token][msg.sender] < amount) throw;
    tokens[token][msg.sender] = safeSub(tokens[token][msg.sender], amount);
    if (token == address(0)) {
      if (!msg.sender.send(amount)) throw;
    } else {
      if (!Token(token).transfer(msg.sender, amount)) throw;
    }
    Withdraw(token, msg.sender, amount, tokens[token][msg.sender]);
}
```
For `withdraw()`, it just does a simple balance check and withdraws ETH to the sender if the _token_ parameter is the 0x0 address, but if it's given an address that isn't 0x0 it assumes the address a token contract and calls the proper transfer function for it.
**Note:** This function can only be called by the user as an escape hatch incase the main IDEX site down or disabled for an extended amount of time. It shouldn't be called nearly as often as the `adminWithdraw()`.

```
function adminWithdraw(address token, uint256 amount, address user, uint256 nonce, uint8 v, bytes32 r, bytes32 s, uint256 feeWithdrawal) onlyAdmin returns (bool success) {
    bytes32 hash = keccak256(this, token, amount, user, nonce);
    if (withdrawn[hash]) throw;
    withdrawn[hash] = true;
    if (ecrecover(keccak256("\x19Ethereum Signed Message:\n32", hash), v, r, s) != user) throw;
    if (feeWithdrawal > 50 finney) feeWithdrawal = 50 finney;
    if (tokens[token][user] <> amount) throw;
    tokens[token][user] = safeSub(tokens[token][user], amount);
    tokens[token][feeAccount] = safeAdd(tokens[token][feeAccount], safeMul(feeWithdrawal, amount) / 1 ether);
    amount = safeMul((1 ether - feeWithdrawal), amount) / 1 ether;
    if (token == address(0)) {
      if (!user.send(amount)) throw;
    } else {
      if (!Token(token).transfer(user, amount)) throw;
    }
    lastActiveTransaction[user] = block.number;
    Withdraw(token, user, amount, tokens[token][user]);
}
```

With `adminWithdraw()`, it has a lot of parameters but the main ones you want to watch for are `token` and `amount` for withdraw calculations. if you would like to track the fees you can also track `feeWithdrawal` which is taken out of the token being transferred.

**Note:** Some contract transactions go back to pre-byzantium fork, so if you would like remove transactions that failed, note that `transactionStatus` in a tx receipt is considered undefined if it is in a block from pre-byzantium.

## Total Users

To track total users you can get all the senders for `deposit()` and `depositToken()` although for getting the users making trades, which are essential to total user counts you want to actually track `tradeAddresses[2]` and `tradeAddresses[3]` for the `trade()` function, and ignore all the broadcasters (in reality though there are no more than a handful of broadcasters so including them won't be a problem).

```
function trade(uint256[8] tradeValues, address[4] tradeAddresses, uint8[2] v, bytes32[4] rs) onlyAdmin returns (bool success)
```

You also want to track the senders of `withdraw()`, and the `user` parameter of the `adminWithdraw()` function, any `onlyAdmin` function has the actual user in its parameters, because it is called by the broadcasters.

**Note:** `adminWithdraw()` is again, called much more often than `withdraw()`, so it is very important to watch that function and the `user` prop instead of the normal `withdraw()` function.

```
function adminWithdraw(address token, uint256 amount, address user, uint256 nonce, uint8 v, bytes32 r, bytes32 s, uint256 feeWithdrawal) onlyAdmin returns (bool success)
```

## Total TXs

For tracking all TXs make sure to remember any admin functions are executed by the IDEX broadcaster accounts. Only trades that are matched are broadcasted to the network, so only matched trades are counted as transactions.

**Note:** Remember that tracking all the senders of TXs is **not accurate** for calculating user count.Only for total transactions and interactions made with the contract.

## Balance

Balance of users on the exchange can be retrieved using `balanceOf(address token, address user)`:

```
function balanceOf(address token, address user) constant returns (uint256) {
    return tokens[token][user];
}
```

Through which you pass in the token address and the user you would like to see the balance of. The contract balance in its entirety can be retrieved through web3 or calling the `balanceOf()` function from the respective tokens you want to check.

**Note:** To get the balance of ETH that an account has in the exchange, pass in _0x0000000000000000000000000000000000000000_ as the token address.
