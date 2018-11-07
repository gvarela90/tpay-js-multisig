import { Decimal } from 'decimal.js';
import {
  intToHex,
  encodingLength,
  payScript
} from './utils';

export default class Output {
  constructor(address, value) {
    this.address = address;
    this.value = new Decimal(value);
  }

  static fromObject(obj) {
    return new Output(obj.address, obj.value);
  }

  serialize() {
    const amount = intToHex(this.value.toNumber(), 8);
    const script = payScript('address', this.address);
    const encodingLen = encodingLength(script.length / 2);
    return amount + encodingLen + script;
  }

  toObject() {
    return {
      address: this.address,
      value: this.value.toNumber()
    };
  }
}
