
/* eslint-disable */
import Transaction from './transaction';

const privateKey = ['5f3da7ee0ceed5d51258b3f8661ebff58ddabc7f69c50c482875cc641f3978e8', 'b9f373f8e1b8824f6f0cf65315bcbe2d11154b10014150ce572c050b05dacfd5'];
// D95upq8MqqRDGhQgCv1L92bi2ccqR3NP77:b9f373f8e1b8824f6f0cf65315bcbe2d11154b10014150ce572c050b05dacfd5
// DQD44a6m4u8rvngXMczDSf7C6gtsJBHsvt:ca7cb395f7baffabf2023dcaebedf8a14196748a6bbf149acdf89df868c6f5ae
// D8CxB96MkFz25jSrvhaf8M4MCx9XovpMr5:5f3da7ee0ceed5d51258b3f8661ebff58ddabc7f69c50c482875cc641f3978e8

const inputs = [
  {
    address: 'D8CxB96MkFz25jSrvhaf8M4MCx9XovpMr5',
    txid: '1e3b3a0472668f9979c5d23735acf62fc5a17a19d49158cbf030214fef79a8e8',
    value: 0.5,
    vout: 0
  },
  {
    address: 'D95upq8MqqRDGhQgCv1L92bi2ccqR3NP77',
    txid: '2e3b3a0472668f9979c5d23735acf62fc5a17a19d49158cbf030214fef79a8e8',
    value: 0.6,
    vout: 2
  }
];

const tx = new Transaction()
  .from(inputs)
  // .to('DQD44a6m4u8rvngXMczDSf7C6gtsJBHsvt', 0.2)
  .to('TKdah98izEwFFfWkY78Egs3gdbgn4b7K7K', 0.0001)
  .to('TM9bW7TMT115YkhBUJ8Gnsax8dQymYJiPM', 0.0001)
  .to('TNB9Fgs1bUmkRbhmuK4tbcRZT37dbQYHQt', 0.0001)
  .changeTo('D8CxB96MkFz25jSrvhaf8M4MCx9XovpMr5')
  .sign(privateKey);
// import {inputScript, serialize, intToHex, signHex} from './helpers';


// console.log(serialize(tx.inputs, tx.outputs, 10, tx.nTime));
// console.log('SIGN')
// tx.sign()
const x = tx.getRaw();

console.log(`VERGEd sendrawtransaction ${x}`);
