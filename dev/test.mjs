import {Blockchain} from './blockchain.mjs';
import * as uuid from 'uuid';

const bitcoin = new Blockchain('http://0.0.0.0:3000', uuid.v4());
console.log(bitcoin.nodeIdentifier);
