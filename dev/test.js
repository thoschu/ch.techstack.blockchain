const Bc = require('./blockchain');

const bitcoin = new Bc();

bitcoin.createNewBlock(904561652, 'efef-deed-rfhw-ehde-34', '34e-dede8-305mc-jfeerfn');

bitcoin.createNewTransaction(100, 'Tim', 'Andrea');

bitcoin.createNewBlock(8754673267, 'efef-rfhw-ehde-34', '348-305mc-jferf-ddn');

bitcoin.createNewTransaction(100, 'Tim', 'Andrea');
bitcoin.createNewTransaction(500, 'Tim', 'Andrea');
bitcoin.createNewTransaction(1600, 'Tim', 'Andrea');

bitcoin.createNewBlock( 564551117, 'aaefef-rfhw-ehde-34', 'tz48-305mc-jferf-ddn');

// console.log(bitcoin.chain[bitcoin.chain.length - 1]);
console.log(bitcoin);
