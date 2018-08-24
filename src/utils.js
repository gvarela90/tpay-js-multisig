import coinstring from 'coinstring';
import crypto from 'crypto';
import isArray from 'lodash/isArray';
import { Buffer } from 'buffer';
import { COINS } from './constants';

const bcAddressToHash160 = (address) => {
  const base58 = coinstring.decode(address);
  const type = base58[0];
  const hash160 = base58.slice(1, 25);
  return [type, hash160.toString('hex')];
};

export const getAsArray = value => (isArray(value) ? value : [value]);

export const valueFromUser = amount => amount * COINS;

export const valueForUser = amount => amount / COINS;

const sha256 = buf => crypto.createHash('sha256').update(buf).digest();

export const sha256sha256 = buf => sha256(sha256(buf));

export const intToHex = (i, length = 1) => {
  let s = i.toString(16);
  const a = Array(2 * length - s.length).fill('0');
  a.push(s);
  s = a.join('');
  const buffer = Buffer.from(s, 'hex');
  return buffer.reverse().toString('hex');
};

// AKA var_int
export const encodingLength = (number) => {
  if (number < 0xfd) {
    return intToHex(number);
  }
  if (number <= 0xffff) {
    return ['fd', intToHex(number, 2)].join('');
  }
  if (number <= 0xffffffff) {
    return ['fe', intToHex(number, 4)].join('');
  }
  return ['ff', intToHex(number, 8)].join('');
};

export const getReverseHexFromString = (str) => {
  const buffer = Buffer.from(str, 'hex');
  return buffer.reverse().toString('hex');
};

export const pushScript = (x) => {
  let hex;
  const size = x.length / 2;

  if (size < 0x4c) {
    hex = intToHex(size);
  } else if (size <= 0xff) {
    hex = ['4c', intToHex(size)].join('');
  } else if (size <= 0xffff) {
    hex = ['4d', intToHex(size, 2)].join('');
  } else {
    hex = ['4e', intToHex(size, 4)].join('');
  }

  return [hex, x].join('');
};

export const payScript = (outputType, address) => {
  if (outputType === 'script') {
    return address.encode('hex');
  }
  let script = '';
  const [addrtype, hash160] = bcAddressToHash160(address);
  if ([65].includes(addrtype)) {
    script = '76a9';
    script += pushScript(hash160);
    script += '88ac';
  } else if ([126].includes(addrtype)) {
    script = 'a9';
    script += pushScript(hash160);
    script += '87';
  } else {
    throw new Error('No address type found');
  }

  return script;
};
