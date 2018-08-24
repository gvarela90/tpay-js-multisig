/* eslint no-underscore-dangle: 0 */
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
  getAsArray
} from './utils';

import {
  PARTIAL_TXN_HEADER_MAGIC,
  MIN_TXOUT_AMOUNT,
  FEE_PER_KB,
  MIN_RELAY_TX_FEE
} from './constants';


const ERRORS = {
  signed: 'Transaction already signed',
  notFunds: 'Not enough funds',
  invalidUnspentValue: 'Unable to calculate the unspent value.',
  valueTooSmall: `Send amount too small, min value allow ${MIN_TXOUT_AMOUNT}`
};

export default class Transaction {
  constructor() {
    this.keysByAddress = {};
    this.nTime = 1535080582; // Number(Math.floor((new Date()).getTime() / 1000));
    this.nLocktime = 0;
    this.raw = undefined;
    this.redeemScript = '';
    this.inputs = [];
    this.outputs = [];
    this.oChangeTo = undefined;
    this.fee = undefined;
    this.numSig = 2;
    this.version = 1;
    this.keyStore = {};
  }

  static getTotal(array) {
    const reducer = (accumulator, item) => accumulator + item.value;
    return array.reduce(reducer, 0);
  }

  _checkSigned() {
    return this._isComplete();
  }

  _isComplete() {
    return this.inputs.every(input => input.isComplete());
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
    if (this.getUnspentValue() < 0) {
      throw (ERRORS.notFunds);
    }

    const fee = this.getFee();
    const changeAmount = unspendValue - fee;
    if (changeAmount < 0) {
      throw new Error(`${ERRORS.notFunds}. \nFEE=${fee} \nUNSPENTVALUE=${unspendValue} \nMISSING=${Math.abs(changeAmount)}`);
    }
  }

  checkOutputsTotal() {
    if (Transaction.getTotal(this.outputs) < MIN_TXOUT_AMOUNT) {
      throw (ERRORS.valueTooSmall);
    }
  }

  addChangeOutput() {
    let fee = this.getFee();

    if (isUndefined(this.oChangeTo)) {
      fee = this.getUnspentValue();
    } else {
      let changeAmount = this.getUnspentValue() - fee;
      if (changeAmount > 0) {
        this.outputs.push(new Output(this.oChangeTo, changeAmount));

        // recompute fee including change output and check
        // if change amount is greater than 0
        fee = this.getFee();

        // remove change output in order to get the correct unspent amount
        this.outputs.pop();

        changeAmount = this.getUnspentValue() - this.getFee();
        if (changeAmount > 0) {
          this.outputs.push(new Output(this.oChangeTo, changeAmount));
        }
      }
    }

    this.fee = fee;
  }

  prepareInputs() {
    this.inputs.forEach(input => input.prepare(this.keyStore[input.address]));
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
    const result = inputs - outputs;
    if (Number.isNaN(result)) {
      throw new Error(ERRORS.invalidUnspentValue);
    }
    return result;
  }

  estimatedSize() {
    return Number(this._serialize(true).length / 2);
  }

  estimatedFee() {
    const estimatedSize = this.estimatedSize();
    let fee = Math.ceil(estimatedSize / 1000) * FEE_PER_KB;
    if (fee < MIN_RELAY_TX_FEE) {
      fee = MIN_RELAY_TX_FEE;
    }
    return fee;
  }

  getFee() {
    if (!isUndefined(this.fee)) {
      return this.fee;
    }

    return this.estimatedFee();
  }

  from(utxo) {
    this._checkSigned();
    const utxoList = isArray(utxo) ? utxo : [utxo];

    utxoList.forEach((input) => {
      this.inputs.push(new Input(input));
    });

    return this;
  }

  to(address, value) {
    this._checkSigned();
    if (!this.outputs.length) {
      this.outputs.push(new Output(address, valueFromUser(value)));
      try {
        this.checkOutputsTotal();
      } catch (error) {
        this.outputs.pop();
        throw error;
      }
    }

    return this;
  }

  changeTo(address) {
    this._checkSigned();
    this.oChangeTo = address;
    return this;
  }

  sign(keys) {
    const keysList = getAsArray(keys);
    keysList.forEach((key) => {
      this.keyStore[key.address] = key;
    });
    this.checkFunds();
    this.prepareTransaction();

    Object.keys(this.keyStore).forEach((key) => {
      const keyStore = this.keyStore[key];
      const privatekeys = getAsArray(keyStore.privatekeys);

      privatekeys.forEach((privateKey) => {
        this.inputs.forEach((input, index) => {
          if (!input.isComplete() && input.canSign(privateKey)) {
            const sig = this._signTransactionInput(index);
            input.addSignature(sig);
          }
        });
      });
    });
    this.raw = this._serialize();
    return this;
  }

  getRaw() {
    return this.raw;
  }

  setFee(fee) {
    this.fee = valueFromUser(fee);
    return this;
  }
}