import {
  MIN_TXOUT_AMOUNT
} from './constants';

export const ERROR_MESSAGES = {
  signed: 'Transaction already signed',
  notFunds: 'Not enough funds',
  invalidUnspentValue: 'Unable to calculate the unspent value.',
  valueTooSmall: `Send amount too small, min value allow ${MIN_TXOUT_AMOUNT}`,
  invalidSignature: 'Invalid signature'
};

export class TPayError extends Error {
  constructor(message, extra) {
    super(message);
    Error.captureStackTrace(this, this.constructor);
    this.extra = extra;
  }
}
