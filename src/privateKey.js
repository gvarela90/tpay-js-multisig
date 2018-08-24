import bitcore from 'bitcore-lib';
import { ec as ECSDA } from 'elliptic';

const coinData = {
  tokenpay: {
    mainnet: {
      network_data: {
        name: 'tokenpay/mainnet',
        alias: 'tokenpay livenet',
        pubkeyhash: 0x1e,
        privatekey: 0xb3,
        scripthash: 0x21,
        xpubkey: 0x0488B21e,
        xprivkey: 0x0488ade4,
        wif: 0x9e,
      },
      bip44_id: 265
    }
  }
};


export default (privateKey) => {
  const ec = new ECSDA('secp256k1');
  return ec.keyFromPrivate(privateKey, 'hex');
};
