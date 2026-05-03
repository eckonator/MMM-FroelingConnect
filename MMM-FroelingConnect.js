/* global Module */

/* MagicMirror²
 * Module: MMM-FroelingConnect
 *
 * By Markus Eckert https://github.com/eckonator/
 * MIT Licensed.
 */

Module.register("MMM-FroelingConnect", {

	componentStates: {},
	froelingAPIerror: {
		status: null,
		statusText: null
	},

	defaults: {
		username: 'youremail@provider.com',
		password: 'yourPassword',
		interval: 5, // Minutes
		showComponents: [
			'Austragung',
			'Puffer 01',
			'Boiler 01',
			'Heizkreis 01',
			'Kessel'
		],
		showComponentDetailValues: [
			'Füllstand im Pelletsbehälter',
			'Resetierbarer t-Zähler:',
			'Resetierbarer kg-Zähler:',
			'Zähler RESET',
			'Pelletlager Restbestand',
			'Pelletlager Mindestbestand',
			'Pelletverbrauch Gesamt',
			'Pelletverbrauch-Zähler',
			'Puffertemperatur oben',
			'Puffertemperatur unten',
			'Pufferladezustand',
			'Pufferpumpen Ansteuerung',
			'Boilertemperatur oben',
			'Boilerpumpe Ansteuerung',
			'Vorlauf-Isttemperatur',
			'Vorlauf-Solltemperatur',
			'Außentemperatur',
			'Kesseltemperatur',
			'Abgastemperatur',
			'Verbleibende Heizstunden bis zur Asche entleeren Warnung',
			'Saugzug - Ansteuerung',
			'Restsauerstoffgehalt'
		],
		modulWidth: '700px',
		showComponentName: true,
		showComponentImage: true,
		showComponentDetails: true,
		componentWithBorder: true,
		amongComponents: false,
		runOwnJsonApiServerInLocalNetwork: false,
		ownJsonApiServerPort: 3000
	},

	getStyles: function() {
		return ['MMM-FroelingConnect.css'];
	},

	getScripts: function() {
		return [];
	},

	start: function() {
		this.config = Object.assign({}, this.defaults, this.config);
		Log.info("Starting module: " + this.name);
		this.login();
	},

	login: function() {
		this.sendSocketNotification("MMM-FroelingConnect-Login", this.config);
	},

	getDom: function() {
		const self = this;

		const wrapperEl = document.createElement("div");
		wrapperEl.setAttribute("class", "mmm-froelingconnect-wrapper");
		if (typeof self.config.modulWidth === 'string') {
			wrapperEl.setAttribute("style", "width: " + self.config.modulWidth + ";");
		}

		if (typeof self.froelingAPIerror.status === 'number') {
			const apiErrorStatus = document.createElement('h4');
			apiErrorStatus.setAttribute("class", "api-error-status text-center");

			const strong = document.createElement('strong');
			strong.innerText = self.froelingAPIerror.status + ":";
			apiErrorStatus.appendChild(strong);
			apiErrorStatus.appendChild(document.createTextNode(" " + self.froelingAPIerror.statusText));
			apiErrorStatus.appendChild(document.createElement('br'));

			const small = document.createElement('small');
			small.innerText = "Try to reconnect every " + self.config.interval + " minutes...";
			apiErrorStatus.appendChild(small);

			wrapperEl.appendChild(apiErrorStatus);
			return wrapperEl;
		}

		Object.keys(self.componentStates).forEach(function(key, i) {
			const component = self.componentStates[key];
			if (!self.config.showComponents.includes(component.name)) {
				return;
			}

			const componentWrapper = document.createElement('div');
			const borderClass = self.config.componentWithBorder ? "component-wrapper" : "component-wrapper no-border";
			componentWrapper.setAttribute("class", borderClass + " component-wrapper-" + i);
			if (self.config.amongComponents) {
				componentWrapper.setAttribute("style", "flex-grow: 0; flex-basis: 100%;");
			}
			wrapperEl.appendChild(componentWrapper);

			if (self.config.showComponentName) {
				const headline = document.createElement('p');
				headline.setAttribute("class", "component-headline");
				headline.innerText = component.name;
				componentWrapper.appendChild(headline);
			}

			if (self.config.showComponentImage) {
				const img = document.createElement('object');
				img.setAttribute("type", "image/svg+xml");
				img.setAttribute("class", "component-image");
				img.data = component.topView.pictureUrl;
				componentWrapper.appendChild(img);
			}

			if (self.config.showComponentDetails) {
				const componentDetail = document.createElement('p');
				componentDetail.setAttribute("class", "component-details");
				Object.keys(component.stateView).forEach(function(key) {
					const stateView = component.stateView[key];
					if (!self.config.showComponentDetailValues.includes(stateView.displayName)) {
						return;
					}
					const label = stateView.displayName.endsWith(":")
						? stateView.displayName + " "
						: stateView.displayName + ": ";
					const line = document.createElement('span');
					line.innerText = label + stateView.value + " " + stateView.unit;
					componentDetail.appendChild(line);
					componentDetail.appendChild(document.createElement('br'));
				});
				componentWrapper.appendChild(componentDetail);
			}
		});

		return wrapperEl;
	},

	socketNotificationReceived: function(notification, payload) {
		const self = this;
		if (notification === "MMM-FroelingConnect-Login-OK") {
			self.froelingAPIerror.status = null;
			self.froelingAPIerror.statusText = null;
			self.sendSocketNotification("MMM-FroelingConnect-InitDevices", payload);
		}
		if (notification === "MMM-FroelingConnect-newCompontentState") {
			self.componentStates = payload;
			self.updateDom();
		}
		if (notification === "MMM-FroelingConnect-Login-ERROR") {
			self.froelingAPIerror.status = payload.froelingAPIerror.status;
			self.froelingAPIerror.statusText = payload.froelingAPIerror.statusText;
			self.updateDom();
			Log.info("MMM-FroelingConnect: Reconnecting in " + payload.interval + " minutes.");
			setTimeout(function() {
				Log.info("MMM-FroelingConnect: Attempting reconnect now...");
				self.login();
			}, payload.interval * 60 * 1000);
		}
	},
});
