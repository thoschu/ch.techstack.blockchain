import {Blockchain} from './blockchain.mjs';
import * as uuid from 'uuid';

const bitcoin = new Blockchain('http://0.0.0.0:3000', uuid.v4());
console.log(bitcoin.nodeIdentifier);
let block = bitcoin.createNewBlock(904561652, 'efef-deed-rfhw-ehde-34', '34e-dede8-305mc-jfeerfn');
console.log(block);
