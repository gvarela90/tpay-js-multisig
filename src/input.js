/* eslint no-underscore-dangle: 0 */
import isUndefined from 'lodash/isUndefined';
import isArray from 'lodash/isArray';
import { Script } from 'bitcore-lib';
import { ec as ECSDA } from 'elliptic';
import {
  valueFromUser,
  getReverseHexFromString,
  intToHex,
  encodingLength,
  pushScript,
  getAsArray
} from './utils';
import { MULTISIG_APPLICATION } from './constants';

const TYPE = 'p2sh';

export default class Input {
  constructor(data) {
    // TODO: To validate that address is p2sh type.
    this.type = TYPE;
    this.numSig = data.numSigns || MULTISIG_APPLICATION[0];
    this.signatures = data.signatures || Array(MULTISIG_APPLICATION[1]).fill(undefined);
    this.address = data.address;
    this.prevoutN = data.vout || 0;
    this.prevoutHash = data.txid;
    this.value = valueFromUser(data.value || data.amount);
    this.pubkeys = data.pubkeys || [];
    this.redeemScript = data.redeemScript || undefined;
    this.sequence = data.sequence || undefined;
    this.key = data.key || undefined;
    this.keys = data.keys || [];

    this.returnSign = '';
  }

  _getSigLists(estimateSize = false) {
    let sigList;
    // let pkList;
    if (estimateSize) {
      // const initialPk = Array(0x21)
      //   .fill('00')
      //   .join('');
      const initialSig = Array(0x48)
        .fill('00')
        .join('');
      // pkList = Array(3).fill(initialPk);
      sigList = Array(this.numSig).fill(initialSig);
    } else if (this.isComplete()) {
      // pkList = this.pubkeys;
      sigList = this.signatures.filter(sig => !!sig);
    } else {
      // pkList = this.pubkeys;
      sigList = this.signatures.map(sig => (sig || 'ff'));
    }


    return sigList;
  }

  prepare(data) {
    // TODO: To validate that address is p2sh type.
    this.pubkeys = data.pubkeys || this.pubkeys;
    this.redeemScript = data.redeemScript || this.redeemScript;
    this.keys = getAsArray(data.privatekeys || this.keys);
    this.getRedeemScript();
  }

  isComplete() {
    const signatures = this.signatures.filter(sig => !!sig);
    return signatures.length === this.numSig;
  }

  canSign(privateKey) {
    if (this.keys.includes(privateKey)) {
      const ec = new ECSDA('secp256k1');
      this.key = ec.keyFromPrivate(privateKey, 'hex');

      const k = {
        f271742fa3a1165573e36e5aea3e800281e966599ae38100cf8654f9bc22df54: '30440220673a84f4362852e42e1149c8feed7771a707daed87701fe793bc21d6fc9902a5022056a484979f03f23a47cd3746c86792f1812a6f75e2333836c182028f10a4d55001',
        '33332a29b9e248f70157ec60ac74b4a2857719f907d5671de56f184b9a9adef1': '3045022100b88fcb8c42984b1336aba15108d24af7547d1cc1028a030ec7aa031b62a6c21e0220561b33b88da26f0cf5ae88c01988e569ef4cfd79a3b1cf5196ff36e636650d2201'
      };
      this.n = privateKey;
      this.returnSign = k[privateKey];
      return true;
    }
    return false;
  }

  sign(hash) {
    const signature = this.key.sign(hash, undefined, { canonical: true });
    let derSign = signature.toDER('hex');
    if (!this.key.verify(hash, derSign)) {
      throw new Error('Invalid signature');
    }
    derSign = `${derSign}01`;
    console.log('');
    console.log('hash', hash.toString('hex'));
    console.log(derSign);
    console.log(this.returnSign, this.n);
    console.log('========', derSign === this.returnSign);
    return derSign;
  }

  serialize(script) {
    const prevoutHash = getReverseHexFromString(this.prevoutHash);
    const prevoutN = intToHex(this.prevoutN, 4);
    const scriptLen = encodingLength(script.length / 2);
    const sequence = isUndefined(this.sequence) ? 'feffffff' : intToHex(this.sequence, 4);

    return prevoutHash + prevoutN + scriptLen + script + sequence;
  }

  getScript(estimateSize = false) {
    const getScriptFromSignatures = sigList => sigList.map(x => pushScript(x)).join('');

    const sigList = this._getSigLists(estimateSize);
    return `00${getScriptFromSignatures(sigList)}${pushScript(this.getRedeemScript())}`;
  }

  getRedeemScript() {
    if (!this.redeemScript) {
      if (isArray(this.pubkeys) && this.pubkeys.length === MULTISIG_APPLICATION[1]) {
        const redeemScript = Script.buildMultisigOut(this.pubkeys, MULTISIG_APPLICATION[0]);
        this.redeemScript = redeemScript.toBuffer().toString('hex');
      } else {
        // TODO: Fix error
        throw new Error('');
      }
    }
    return this.redeemScript;
  }

  addSignature(signature) {
    this.signatures.push(signature);
  }
}
