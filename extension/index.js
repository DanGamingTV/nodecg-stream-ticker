'use strict';
const {
	triggerAsyncId
} = require('async_hooks');
const {
	OBSUtility
} = require('nodecg-utility-obs');

module.exports = function (nodecg) {
	nodecg.Replicant('brandReplicant', {
		defaultValue: 'danno.nz'
	});
	const tickerReplicant = nodecg.Replicant('tickerReplicant', {
		defaultValue: 'danno.nz livestream'
	})
	const statsReplicant = nodecg.Replicant('statsReplicant', {
		defaultValue: {
			"willReshow": false,
			"willCopyright": false,
			"copyrightCountdown": 0,
			"copyrightShowing": false,
			"doingCopyright": false,
			"copyrightDuration": 5000
		}
	});
	const showTicker = nodecg.Replicant('showTicker', {
		defaultValue: {
			bool: true,
			fromTransition: false
		}
	});
	nodecg.log.info("hi")
	var transitionsToHideOn = [
		"Stinger1", "Stinger2"
	]
	var reShowOnNextTransitionEnd = false
	const doTransitionHide = nodecg.Replicant('doTransitionHide', {
		defaultValue: false
	})
	var excludedScenes = ["StartingSoon"]
	const obs = new OBSUtility(nodecg);
 	obs.on('TransitionBegin', (data) => {
		if (transitionsToHideOn.includes(data.name) || excludedScenes.includes(data["to-scene"])) {
			doTransitionHide.value = true
			reShowOnNextTransitionEnd = true;
			statsReplicant.value["willReshow"] = true;
		}
	}) 
	var copyrightScenes = ["Outro"];
		function copyrightTicker() {
			
			var timeToShowCopyright = 10; //seconds
			obs.send('GetCurrentScene').then(data => {
				if(copyrightScenes.includes(data["name"])) {
					showTicker.value = {
						bool: false,
						fromTransition: true
					}
					statsReplicant.value["willCopyright"] = true;
					statsReplicant.value["doingCopyright"] = true
					statsReplicant.value["copyrightCountdown"] = timeToShowCopyright * 1000
					var localDoingCopyright = true;
					var showCopy = setTimeout(() => {
						statsReplicant.on('change', value => {
							if (value["doingCopyright"] == false) {
								if (localDoingCopyright == true) {
									clearTimeout(showCopy)
									clearTimeout(hideCopy)
									showTicker.value = {
										bool: false,
										fromTransition: true
									}
									tickerReplicant.value = ""
									localDoingCopyright = false;
									return;
								}
							}
						})
						console.log("Showing copyright")
						tickerReplicant.value = `©${new Date().getFullYear()}`
						showTicker.value = {
							bool: true,
							fromTransition: true
						}
						statsReplicant.value["copyrightShowing"] = true
						var hideCopy = setTimeout(() => {
							console.log("Hiding copyright")
							showTicker.value = {
								bool: false,
								fromTransition: true
							}
							statsReplicant.value["copyrightShowing"] = false
							statsReplicant.value["willCopyright"] = false;
							statsReplicant.value["doingCopyright"] = false
						}, 5000)
						//for if user stops copyright thing in the middle
						
					}, timeToShowCopyright * 1000)


				}
			})
			
		}
	obs.on('SwitchScenes', (data) => {
		//Excluded scenes are scenes that we won't reshow the ticker on
		if(!copyrightScenes.includes(data["scene-name"])) {
			if (statsReplicant.value["doingCopyright"] == true) {
				statsReplicant.value["doingCopyright"] = false
			}
		}
		if (excludedScenes.includes(data["scene-name"])) {
			statsReplicant.value["willReshow"] = false;
			reShowOnNextTransitionEnd = false;
			doTransitionHide.value = true
		} else {
			reShowOnNextTransitionEnd = true;
		}
		if (reShowOnNextTransitionEnd == true) {
		

				if (copyrightScenes.includes(data["scene-name"])) {
					copyrightTicker()
				}
				
				doTransitionHide.value = false
				reShowOnNextTransitionEnd = false;
				statsReplicant.value["willReshow"] = true;
			
		}
	})
};
