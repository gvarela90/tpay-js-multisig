/* eslint no-underscore-dangle: 0 */
import isUndefined from 'lodash/isUndefined';
import isArray from 'lodash/isArray';
import { Script } from 'bitcore-lib';
import { ec as ECSDA } from 'elliptic';
import {
  valueFromUser,
  valueForUser,
  getReverseHexFromString,
  intToHex,
  encodingLength,
  pushScript,
  getAsArray
} from './utils';
import { MULTISIG_APPLICATION, ADDRESS_TYPE } from './constants';

export default class Input {
  constructor(data) {
    // TODO: To validate that address is p2sh type.
    this.type = ADDRESS_TYPE;
    this.numSig = data.numSig || MULTISIG_APPLICATION[0];
    this.signatures = data.signatures || Array(this.numSig + 1).fill(undefined);
    this.address = data.address;
    this.prevoutN = data.vout || 0;
    this.prevoutHash = data.txid;
    this.value = valueFromUser(data.value || data.amount);
    this.pubkeys = data.pubkeys || [];
    this.redeemScript = data.redeemScript || undefined;
    this.sequence = data.sequence || undefined;
    this.key = data.key || undefined;
    this.keys = data.keys || [];
  }

  static fromObject(obj) {
    return new Input(obj);
  }

  _getSigLists(estimateSize = false) {
    let sigList;
    if (estimateSize) {
      const initialSig = Array(0x48)
        .fill('00')
        .join('');
      sigList = Array(this.numSig).fill(initialSig);
    } else if (this.isComplete()) {
      sigList = this.signatures.filter(sig => !!sig);
    } else {
      sigList = this.signatures.map(sig => sig || 'ff');
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
      return true;
    }
    return false;
  }

  sign(hash) {
    const signature = this.key.sign(hash, undefined, { canonical: true });
    const derSign = signature.toDER('hex');
    if (!this.key.verify(hash, derSign)) {
      throw new Error('Invalid signature');
    }
    return `${derSign}01`;
  }

  serialize(script) {
    const prevoutHash = getReverseHexFromString(this.prevoutHash);
    const prevoutN = intToHex(this.prevoutN, 4);
    const scriptLen = encodingLength(script.length / 2);
    const sequence = isUndefined(this.sequence)
      ? 'feffffff'
      : intToHex(this.sequence, 4);

    return prevoutHash + prevoutN + scriptLen + script + sequence;
  }

  getScript(estimateSize = false) {
    const getScriptFromSignatures = sigList => sigList.map(x => pushScript(x)).join('');

    const sigList = this._getSigLists(estimateSize);
    return `00${getScriptFromSignatures(sigList)}${pushScript(
      this.getRedeemScript()
    )}`;
  }

  getRedeemScript() {
    if (!this.redeemScript) {
      if (
        isArray(this.pubkeys) && this.pubkeys.length === (this.numSig + 1)
      ) {
        const redeemScript = Script.buildMultisigOut(
          this.pubkeys,
          MULTISIG_APPLICATION[0]
        );
        this.redeemScript = redeemScript.toBuffer().toString('hex');
      } else {
        // TODO: Fix error
        throw new Error('');
      }
    }
    return this.redeemScript;
  }

  addSignature(signature) {
    const index = this.signatures.indexOf(undefined);
    if (index !== -1) {
      this.signatures[index] = signature;
    } else {
      this.signatures.push(signature);
    }
  }

  toObject() {
    return {
      numSig: this.numSig,
      signatures: this.signatures,
      address: this.address,
      vout: this.prevoutN,
      txid: this.prevoutHash,
      value: valueForUser(this.value),
      pubkeys: this.pubkeys,
      redeemScript: this.redeemScript,
      sequence: this.sequence,
    };
  }
}
