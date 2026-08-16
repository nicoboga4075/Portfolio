if (window.innerWidth >= 1024) {
	const script = document.createElement('script');
	script.src = 'https://cdn.botpress.cloud/webchat/v3.3/inject.js';
	script.integrity = 'sha384-q27XaYztfyGV9K34UJCFnCbnIa7DRgZo/WX8wKxn6Qr38BjQV+JbJ2snHJLCqbwc';
	script.crossOrigin = 'anonymous';
	script.onload = function () {
		window.botpress.init({
		  "botId": "ae1c6be3-242d-4559-bda8-8da1cd9b19fc",
		  "configuration": {
			"version": "v2",
			"botName": "Netlify Bot",
			"botAvatar": "https://files.bpcontent.cloud/2025/10/06/10/20251006102939-SK68F9QM.png",
			"botDescription": "",
			"website": {},
			"email": {},
			"phone": {},
			"termsOfService": {},
			"privacyPolicy": {},
			"color": "#3B6FFE",
			"variant": "solid",
			"headerVariant": "glass",
			"themeMode": "light",
			"fontFamily": "Poppins",
			"radius": 2.5,
			"feedbackEnabled": false,
			"footer": "[⚡ by Botpress](https://botpress.com/?from=webchat)",
			"soundEnabled": false,
			"proactiveMessageEnabled": false,
			"proactiveBubbleMessage": "Hi! 👋 Need help?",
			"proactiveBubbleTriggerType": "afterDelay",
			"proactiveBubbleDelayTime": 10
		  },
		  "clientId": "ec2878b6-e7e6-49ac-9f2b-de35edd6a080",
		  "selector": "#webchat"
		});
	};
	document.head.appendChild(script);
}
