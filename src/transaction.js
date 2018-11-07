/* eslint no-underscore-dangle: 0 */
import { Decimal } from 'decimal.js';
import { Buffer } from 'buffer';
import isArray from 'lodash/isArray';
import isUndefined from 'lodash/isUndefined';
import Input from './input';
import Output from './output';

import {
  intToHex,
  encodingLength,
  valueFromUser,
  sha256sha256,
  getAsArray,
  valueForUser
} from './utils';

import {
  PARTIAL_TXN_HEADER_MAGIC,
  MIN_TXOUT_AMOUNT,
  FEE_PER_KB,
  MIN_RELAY_TX_FEE,
  FEERATE_MAX_DYNAMIC
} from './constants';


import { TPayError, ERROR_MESSAGES } from './errors';

export default class Transaction {
  constructor() {
    this.keysByAddress = {};
    this.nTime = Number(Math.floor((new Date()).getTime() / 1000));
    this.nLocktime = 0;
    this.raw = undefined;
    this.inputs = [];
    this.outputs = [];
    this.oChangeTo = undefined;
    this.fee = undefined;
    this.version = 1;
    this.keyStore = [];
  }

  static fromObject(obj) {
    const tx = new Transaction();
    tx.nTime = obj.nTime;
    tx.nLocktime = obj.nLocktime;
    tx.inputs = obj.inputs.map(input => Input.fromObject(input));
    tx.outputs = obj.outputs.map(output => Output.fromObject(output));
    tx.fee = new Decimal(obj.fee);
    tx.version = obj.version;
    tx.oChangeTo = obj.oChangeTo;
    return tx;
  }

  static getTotal(array) {
    const reducer = (accumulator, item) => item.value.plus(accumulator);
    return new Decimal(array.reduce(reducer, 0));
  }

  _checkSigned() {
    if (this._isComplete()) {
      throw new TPayError(ERROR_MESSAGES.signed);
    }
  }

  _isComplete() {
    if (this.inputs.length) {
      return this.inputs.every(input => input.isComplete());
    }
    return false;
  }

  _serialize(estimateSize = false) {
    const version = intToHex(this.version, 4);
    const time = intToHex(this.nTime, 4);
    const locktime = intToHex(this.nLocktime, 4);
    const inputsAmount = encodingLength(this.inputs.length);
    const outputsAmount = encodingLength(this.outputs.length);
    const inputs = this.inputs.map(input => input.serialize(input.getScript(estimateSize))).join('');
    const outputs = this.outputs.map(output => output.serialize()).join('');
    const serialized = version + time + inputsAmount + inputs + outputsAmount + outputs + locktime;

    if (estimateSize || this._isComplete()) {
      return serialized;
    }
    return `${PARTIAL_TXN_HEADER_MAGIC}00${serialized}`;
  }

  _serializePreimage(inputIndex) {
    const version = intToHex(this.version, 4);
    const nLocktime = intToHex(this.nLocktime, 4);
    const time = intToHex(this.nTime, 4);
    const nHashType = intToHex(1, 4);
    const inputsAmount = encodingLength(this.inputs.length);
    const outputsAmount = encodingLength(this.outputs.length);
    const inputs = this.inputs.map((input, index) => {
      const script = index === inputIndex ? input.getRedeemScript() : '';
      return input.serialize(script);
    }).join('');

    const outputs = this.outputs.map(output => output.serialize()).join('');
    return version + time + inputsAmount + inputs + outputsAmount + outputs + nLocktime + nHashType;
  }

  _signTransactionInput(inputIndex) {
    const input = this.inputs[inputIndex];
    const inputHex = this._serializePreimage(inputIndex);
    const hexBuffer = Buffer.from(inputHex, 'hex');
    const preHash = sha256sha256(hexBuffer);
    const signature = input.sign(preHash);
    return signature;
  }

  checkFunds() {
    const unspendValue = this.getUnspentValue();
    if (this.getUnspentValue().lessThan(0)) {
      throw new TPayError(ERROR_MESSAGES.notFunds);
    }

    const fee = this.getFee();
    const changeAmount = unspendValue - fee;
    if (changeAmount < 0) {
      throw new TPayError(`${ERROR_MESSAGES.notFunds}. \nFEE=${fee} \nUNSPENTVALUE=${unspendValue} \nMISSING=${Math.abs(changeAmount)}`);
    }
  }

  checkOutputsTotal() {
    if (Transaction.getTotal(this.outputs) < MIN_TXOUT_AMOUNT) {
      throw new TPayError(ERROR_MESSAGES.valueTooSmall.format(MIN_TXOUT_AMOUNT));
    }
  }

  addChangeOutput() {
    let fee = this.getFee();

    if (isUndefined(this.oChangeTo)) {
      fee = this.getUnspentValue();
    } else {
      let changeAmount = this.getUnspentValue().minus(fee);
      if (changeAmount.greaterThan(0)) {
        this.outputs.push(new Output(this.oChangeTo, changeAmount));

        // recompute fee including change output and check
        // if change amount is greater than 0
        fee = this.getFee();

        // remove change output in order to get the correct unspent amount
        this.outputs.pop();

        changeAmount = this.getUnspentValue().minus(this.getFee());
        if (changeAmount.greaterThan(0)) {
          this.outputs.push(new Output(this.oChangeTo, changeAmount));
        }
      }
    }

    this.fee = fee;
  }

  prepareInputs() {
    this.inputs.forEach(input => input.prepare({ privatekeys: this.keyStore }));
  }

  prepareTransaction() {
    // 1. Add data to inputs
    this.prepareInputs();
    // 2. calculate fee, change and update outputs
    this.addChangeOutput();
  }

  getUnspentValue() {
    const inputs = Transaction.getTotal(this.inputs);
    const outputs = Transaction.getTotal(this.outputs);
    const result = inputs.minus(outputs);
    if (Number.isNaN(result)) {
      throw new TPayError(ERROR_MESSAGES.invalidUnspentValue);
    }
    return result;
  }

  estimatedSize() {
    return new Decimal(this._serialize(true).length / 2);
  }

  estimatedFee() {
    const estimatedSize = this.estimatedSize();
    let fee = new Decimal(FEE_PER_KB).times(estimatedSize.dividedBy(1000).ceil());
    fee = Decimal.min(FEERATE_MAX_DYNAMIC, fee);
    fee = Decimal.max(MIN_RELAY_TX_FEE, fee);
    return fee;
  }

  getFee() {
    if (!isUndefined(this.fee)) {
      return new Decimal(this.fee);
    }

    return this.estimatedFee();
  }

  from(utxo, pubkeys, threshold = 2) {
    this._checkSigned();
    const utxoList = isArray(utxo) ? utxo : [utxo];
    if (!isArray(pubkeys) || pubkeys.length < threshold) {
      throw new TPayError(ERROR_MESSAGES.invalidPubKeys.format(threshold));
    }

    const cpPubkeys = pubkeys.slice();
    cpPubkeys.sort();
    utxoList.forEach((input) => {
      this.inputs.push(new Input({ ...input, numSig: threshold, pubkeys: cpPubkeys }));
    });

    return this;
  }

  to(address, value) {
    this._checkSigned();
    this.outputs.push(new Output(address, valueFromUser(value)));
    try {
      this.checkOutputsTotal();
    } catch (error) {
      this.outputs.pop();
      throw error;
    }

    return this;
  }

  changeTo(address) {
    this._checkSigned();
    this.oChangeTo = address;
    return this;
  }

  sign(keys) {
    this.keyStore = getAsArray(keys);
    this.checkFunds();
    this.prepareTransaction();

    this.keyStore.forEach((key) => {
      this.inputs.forEach((input, index) => {
        if (!input.isComplete() && input.canSign(key)) {
          const sig = this._signTransactionInput(index);
          input.addSignature(sig);
        }
      });
    });
    this.raw = this._serialize();
    return this;
  }

  getRaw() {
    if (!this.raw) {
      this.raw = this._serialize();
    }
    return {
      hex: this.raw,
      complete: this._isComplete()
    };
  }

  getHex() {
    return this.getRaw().hex;
  }

  setFee(fee) {
    this.fee = valueFromUser(fee);
    if (this.fee.lessThan(MIN_RELAY_TX_FEE)) {
      throw new TPayError(ERROR_MESSAGES.invalidFeeAmount.format(valueForUser(MIN_RELAY_TX_FEE)));
    }
    return this;
  }

  toObject() {
    return {
      nTime: this.nTime,
      nLocktime: this.nLocktime,
      inputs: this.inputs.map(input => input.toObject()),
      outputs: this.outputs.map(output => output.toObject()),
      fee: this.fee.toNumber(),
      version: this.version,
      oChangeTo: this.oChangeTo
    };
  }
}
