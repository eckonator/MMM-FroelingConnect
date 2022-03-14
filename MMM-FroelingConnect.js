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
        showComponents: ['Austragung', 'Puffer 01', 'Boiler 01', 'Heizkreis 01', 'Kessel'],
        modulWidth : '700px',
        showComponentName: true,
        componentWithBorder: true,
        amongComponents: false
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

            // console.log(component);
            // console.log(component.name);
            // console.log(component.componentId);
            // console.log(component.topView.pictureUrl);

            Object.keys(component.topView).forEach(function(key, i) {
                const topView = component.topView[key];
                console.log(topView);
            });

            Object.keys(component.stateView).forEach(function(key, i) {
                const stateView = component.stateView[key];
                console.log(stateView);
            });

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
                    headline.innerText = component.name;
                    componentWrapper.appendChild(headline);
                }

                const img = document.createElement('object');
                img.setAttribute("type", "image/svg+xml");
                img.setAttribute("class", "component-image");
                img.data = component.topView.pictureUrl;
                componentWrapper.appendChild(img);
            }
        });

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
