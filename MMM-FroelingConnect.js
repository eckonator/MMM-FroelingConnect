/* global Module */

/* Magic Mirror
 * Module: MMM-FroelingConnect
 *
 * By Markus Eckert https://github.com/eckonator/
 * MIT Licensed.
 */

Module.register("MMM-FroelingConnect", {

    componentStates: {},

    defaults: {
        username : 'youremail@provider.com',
        password : 'yourPassword',
        interval : 5, // Minutes,
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
        modulWidth : '700px',
        showComponentName: true,
        showComponentImage: true,
        showComponentDetails: true,
        componentWithBorder: true,
        amongComponents: false,
        runOwnJsonApiServerInLocalNetwork: false,
        ownJsonApiServerPort: 3000
    },

    getStyles: function () {
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

        console.log('MMM-FroelingConnect: Refreshing DOM...');

        const wrapperEl = document.createElement("div");
        wrapperEl.setAttribute("class", "mmm-froelingconnect-wrapper");
        if(typeof self.config.modulWidth === 'string') {
            wrapperEl.setAttribute("style", "width: "+ self.config.modulWidth + ";");
        }

        Object.keys(self.componentStates).forEach(function(key, i) {
            const component = self.componentStates[key];

            if(self.config.showComponents.includes(component.name)) {
                const componentWrapper = document.createElement('div');
                if(self.config.componentWithBorder) {
                    componentWrapper.setAttribute("class", "component-wrapper component-wrapper-" + i);
                } else {
                    componentWrapper.setAttribute("class", "component-wrapper no-border component-wrapper-" + i);
                }
                if(self.config.amongComponents) {
                    componentWrapper.setAttribute("style", "flex-grow: 0; flex-basis: 100%;");
                }
                wrapperEl.appendChild(componentWrapper);

                if(self.config.showComponentName) {
                    const headline = document.createElement('p');
                    headline.setAttribute("class", "component-headline");
                    headline.innerText = component.name;
                    componentWrapper.appendChild(headline);
                }

                if(self.config.showComponentImage) {
                    const img = document.createElement('object');
                    img.setAttribute("type", "image/svg+xml");
                    img.setAttribute("class", "component-image");
                    img.data = component.topView.pictureUrl;
                    componentWrapper.appendChild(img);
                }

                if(self.config.showComponentDetails) {
                    let componentDetailValue = '';
                    Object.keys(component.stateView).forEach(function (key, i) {
                        const stateView = component.stateView[key];
                        //console.log(stateView);
                        if (self.config.showComponentDetailValues.includes(stateView.displayName)) {
                            let currentComponentDetail = '';
                            if (stateView.displayName.substring(stateView.displayName.length - 1) === ":") {
                                currentComponentDetail = stateView.displayName + ' ' + stateView.value + ' ' + stateView.unit + '<br />';
                            } else {
                                currentComponentDetail = stateView.displayName + ': ' + stateView.value + ' ' + stateView.unit + '<br />';
                            }
                            componentDetailValue += currentComponentDetail;
                        }
                    });

                    const componentDetail = document.createElement('p');
                    componentDetail.setAttribute("class", "component-details");
                    componentDetail.innerHTML = componentDetailValue;
                    componentWrapper.appendChild(componentDetail);
                }
            }
        });

        console.log(self.componentStates);

        const componentDebugTime = document.createElement('p');
        componentDebugTime.setAttribute("class", "component-debug-time");
        componentDebugTime.innerHTML = self.componentStates.time;
        componentDebugTime.appendChild(wrapperEl);

        return wrapperEl;
    },

    socketNotificationReceived: function (notification, payload) {
        var self = this;
        if (notification === "MMM-FroelingConnect-Login-OK") {
            self.sendSocketNotification("MMM-FroelingConnect-InitDevices", payload);
        }
        if (notification === "MMM-FroelingConnect-newCompontentState") {
            self.componentStates = payload;
            self.updateDom();
        }
    },
});
