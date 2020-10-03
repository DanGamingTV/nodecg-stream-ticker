'use strict';

module.exports = function (nodecg) {
	nodecg.Replicant('brandReplicant', {defaultValue: 'danno.nz'});
	nodecg.Replicant('tickerReplicant', {defaultValue: 'danno.nz livestream'})
	nodecg.Replicant('showTicker', {defaultValue: true});
};
