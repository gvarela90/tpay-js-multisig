# tokenpay-wallet-js

A pure JavaScript TokenPay library.

## Usage
### Fields specifications:
`amount` must be in TokenPay amount not in satoshis nor bitcoins e.g. `1`, `5.5`, `10`.

`fee` the minimum value allowed is 0.0001 (10,000).

**Note:** Values are multiplied by 100,000,000

### Private keys

Private keys must be in hex (64 characters).

## Spend from a 2-of-3 multisig P2SH address

```javascript
const Transaction = require('tpay-js-multisig');

const publicKeys = ['<public-key-1>', '<public-key-1>', '<public-key-1>'];

const inputs = [
  {
    txid: '<transaction-id>',
    vout: <vout>,
    amount: 5.5
    address: '<multisig-address>'
  },
];

try {
  const tx = new Transaction()
    .from(inputs, publicKeys, 2)
    .to('<dst-address>', 3)
    .changeTo(<address-receiving-the-change>)
    .setFee(1.5)
    .sign('<private-key-1-for-multisig-address>').
    .sign('<private-key-2-for-multisig-address>');
  const raw = tx.getRaw(); // returns an object {hex: "<hex>", complete: true|false}
} catch (e) {
  console.log(e.message);
}
```

## Get transaction object representation

```javascript
const Transaction = require('tpay-js-multisig');

const publicKeys = ['<public-key-1>', '<public-key-1>', '<public-key-1>'];

const inputs = [
  {
    txid: '<transaction-id>',
    vout: <vout>,
    amount: 5.5
    address: '<multisig-address>'
  },
];

try {
  const tx = new Transaction()
    .from(inputs, publicKeys, 2)
    .to('<dst-address>', 2)
    .sign('<private-key-for-multisig-address>');
  const obj = tx.toObject();
} catch (e) {
  console.log(e.message);
}
```

## Spend from transaction object representation

```javascript
const Transaction = require('tpay-js-multisig');

const publicKeys = ['<public-key-1>', '<public-key-1>', '<public-key-1>'];

const inputs = [
  {
    txid: '<transaction-id>',
    vout: <vout>,
    amount: 5.5
    address: '<multisig-address>'
  },
];

try {
  const tx = new Transaction()
    .from(inputs, publicKeys, 2)
    .to('<dst-address>', 2)
    .sign('<private-key-1-for-multisig-address>');
} catch (e) {
  console.log(e.message);
}

const obj = tx.toObject();
const tx2 = Transaction.fromObject(obj).sign('<private-key-2-for-multisig-address>');
const raw = tx2.getRaw();
```
