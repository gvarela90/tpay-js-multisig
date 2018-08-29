export const ERROR_MESSAGES = {
  signed: 'Transaction is fully signed',
  notFunds: 'Not enough funds',
  invalidUnspentValue: 'Unable to calculate the unspent value.',
  valueTooSmall: 'Send amount too small, min value allow {0}',
  invalidSignature: 'Invalid signature',
  p2shAddress: '{0} is not a P2SH address',
  invalidPubKeys: 'Public keys must be an array of at least {0} keys',
  invalidFeeAmount: 'Fee must be greater than or equal to {0}'
};

export class TPayError extends Error {
  constructor(message, extra) {
    super(message);
    this.extra = extra;
  }
}
