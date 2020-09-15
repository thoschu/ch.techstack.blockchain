const Bc = require('./blockchain');

const bitcoin = new Bc();
// let block =  bitcoin.createNewBlock(8754673267, 'efefrfhw-ehde-34', '348-305mc-jferfddn');
//console.log(block);
bitcoin.createNewBlock(904561652, 'efefdeed-rfhw-ehde-34', '34edede8-305mc-jfeerfn');

bitcoin.createNewTransaction(100, 'Tim', 'Andrea');

console.log(bitcoin);
