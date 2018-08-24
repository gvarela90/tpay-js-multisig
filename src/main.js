/* eslint-disable */
import Transaction from './transaction';
import bitcore from 'bitcore-lib';


const nTime = 1534915776;
const pubKeysArray = [
    '02249f5528a6d51e6c4d3f0a84f01708f74c49c5a6be7747c5a62d31797418e65d', 
    '030aeaa5c609e8d30b20cce3dd2130aafcecde78cb68a8f7ec7bc51d1acf617127', 
    '0382eac4cf44eb47ef4e555246ccf89e087abd68e87279e31c11dd1084167478bd'
]
const privateKey1 = '';
const privateKey2 = '';

const utxo = {
    address: 't6B9Z9CryWGj8RLFiBwSwBqe9KbDYNkDyW',
    value: 0.0978, 
    vout: 1,
    txid: '2e3c741d100fcff79544a9646a3b01f1eca671d09c64be2a04f459c98982b6a7'
};

const redeemScript = bitcore.Script.buildMultisigOut(pubKeysArray, 2);

const signData = [{
    address: 't6B9Z9CryWGj8RLFiBwSwBqe9KbDYNkDyW',
    redeemScript: redeemScript.toBuffer().toString('hex'),
    privatekeys: [privateKey1, privateKey2]
}];


const tx = new Transaction();
tx.from(utxo).to('TMUKGYVZe2pY5jxVqnRYkNSa6yE79cB18s', 0.001).changeTo('t6B9Z9CryWGj8RLFiBwSwBqe9KbDYNkDyW').setFee(0.0001);
tx.sign(signData);

console.log('Raw:', tx.getRaw());
console.log('')
console.log('tokenpayd decoderawtransaction', tx.getRaw())
console.log('')
console.log('tokenpayd sendrawtransaction', tx.getRaw())


// import { ec as ECSDA } from 'elliptic';
// const hash = '00034dd28e59f557a5dcf8b1d440355d203fec0a5cb1787de577161dfd11f9ed';
// const arr = [privateKey1, privateKey2];
// const expected = [
//     '30440220673a84f4362852e42e1149c8feed7771a707daed87701fe793bc21d6fc9902a5022056a484979f03f23a47cd3746c86792f1812a6f75e2333836c182028f10a4d55001',
//     '3045022100b88fcb8c42984b1336aba15108d24af7547d1cc1028a030ec7aa031b62a6c21e0220561b33b88da26f0cf5ae88c01988e569ef4cfd79a3b1cf5196ff36e636650d2201'
// ]


// for(let i = 0; i < arr.length; i++){
//     const ec = new ECSDA('secp256k1');
//     const key = ec.keyFromPrivate(arr[i], 'hex');
//     const signature = key.sign(hash, undefined, {canonical: true});
//     let derSign = signature.toDER('hex');
//     derSign = `${derSign}01`;

//     console.log('=======Inicio======')
//     console.log(hash);
//     console.log(arr[i])
//     console.log('=', derSign)
//     console.log('==', derSign == expected[i]);
//     console.log('=======Fin======')
// }