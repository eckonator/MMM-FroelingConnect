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
        var self = this;
        // Create wrapper element
        displayData = [];
        const wrapperEl = document.createElement("div");
        wrapperEl.setAttribute("class", "mmm-froelingconnect-wrapper");
        if(typeof self.config.modulWidth === 'string') {
            wrapperEl.setAttribute("style", "max-width: "+ self.config.modulWidth + ";");
        }
        Object.keys(self.componentStates).forEach(function(key, i) {
            var component = self.componentStates[key];
            displayData[i] = [];
            Object.values(component).forEach(val => {
                // console.log(val);
                if(typeof val === 'string') {
                    // Name der Komponente
                    displayData[i]['name'] = val;
                    // console.log(val);
                    // var componentWrapper = document.createElement('div');
                    // componentWrapper.setAttribute("class", "component-wrapper component-wrapper-" + i);
                    // wrapperEl.appendChild(componentWrapper);
                    //

                }
                if(typeof val === 'object' && val !== null) {
                    if(typeof val.pictureUrl === 'string') {
                        displayData[i]['pictureUrl'] = val.pictureUrl;
                        // console.log(val.pictureUrl);
                        // var img = document.createElement('object');
                        // img.setAttribute("type", "image/svg+xml");
                        // img.setAttribute("class", "component-image");
                        // img.data = val.pictureUrl;
                        // document.querySelector("component-wrapper-" + i).appendChild(img);
                    }
                }
            });
        });

        //console.log(displayData);

        displayData.forEach(function(item, i) {
            //console.log(item['name']);
            //console.log(item['pictureUrl']);
            if(self.config.showComponents.includes(item['name'])) {
                var componentWrapper = document.createElement('div');
                if(self.config.componentWithBorder) {
                    componentWrapper.setAttribute("class", "component-wrapper component-wrapper-" + i);
                } else {
                    componentWrapper.setAttribute("class", "component-wrapper no-border component-wrapper-" + i);
                }
                if(self.config.amongComponents) {
                    componentWrapper.setAttribute("style", "flex-grow: 0; flex-basis: 100%;");
                }
                wrapperEl.appendChild(componentWrapper);

                var headline = document.createElement('h6');
                headline.innerText = item['name'];
                componentWrapper.appendChild(headline);

                var img = document.createElement('object');
                img.setAttribute("type", "image/svg+xml");
                img.setAttribute("class", "component-image");
                img.data = item['pictureUrl'];
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
