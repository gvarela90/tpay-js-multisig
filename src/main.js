/* eslint-disable */
import Transaction from '.';
import bitcore from 'bitcore-lib';
import { privateKey1, privateKey2 } from './keys';

const printTx = (tx) => {
    console.log('\n=================');
    console.log('Raw:', tx.getRaw());
    console.log('');
    console.log('tokenpayd decoderawtransaction', tx.getHex());
    console.log('');
    console.log('tokenpayd sendrawtransaction', tx.getHex());

}

const pubKeysArray = [
    '030aeaa5c609e8d30b20cce3dd2130aafcecde78cb68a8f7ec7bc51d1acf617127',
    '02249f5528a6d51e6c4d3f0a84f01708f74c49c5a6be7747c5a62d31797418e65d',
    '0382eac4cf44eb47ef4e555246ccf89e087abd68e87279e31c11dd1084167478bd'
];

const utxo = {
    address: 't6B9Z9CryWGj8RLFiBwSwBqe9KbDYNkDyW',
    value: 0.0945,
    vout: 1,
    txid: '685913e55b2a48e2db5ddd5192c352cda7397c9438239b0254298326382df1f2'
};

const tx = new Transaction();
try {
    tx.from(utxo, pubKeysArray, 2)
        .to('TMUKGYVZe2pY5jxVqnRYkNSa6yE79cB18s', 0.0001)
        .changeTo('t6B9Z9CryWGj8RLFiBwSwBqe9KbDYNkDyW')
        // .setFee(0.0001)
        .sign(privateKey2);
    printTx(tx);

    const obj = tx.toObject();

    const tx2 = Transaction.fromObject(obj);
    tx2.sign(privateKey1);
    printTx(tx2);
} catch (e) {
    console.log('Error:', e.message);
}