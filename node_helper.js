const NodeHelper = require('node_helper');
const axios = require('axios').default;
const http = require('node:http');

module.exports = NodeHelper.create({

	config : {},
	deviceArray : [],
	componentsArray : {},
	componentStates : {},
	requestClient : axios.create(),
	updateInterval : null,
	session : {},
	froelingAPIerror : {
		status: null,
		statusText : null
	},
	ownAPIStateData: {},
	ownAPIServerStarted : false,
	lastUpdate: new Date(Date.now()),

	login: async function(payload) {
		const self = this;
		if(Object.keys(self.componentStates).length > 0 && self.componentStates.constructor === Object) {
			self.sendSocketNotification("MMM-FroelingConnect-newCompontentState", self.componentStates);
		}
		self.requestClient({
			method: "post",
			url: "https://connect-api.froeling.com/app/v1.0/resources/loginNew",
			headers: {
				"Content-Type": "application/json",
				Connection: "keep-alive",
				Accept: "*/*",
				"User-Agent": "Froeling PROD/2107.1 (com.froeling.connect-ios; build:2107.1.01; iOS 14.8.0) Alamofire/4.8.1",
				"Accept-Language": "de",
			},
			data: JSON.stringify({
				osType: "IOS",
				userName: payload.username,
				password: payload.password,
			}),
		}).then(function (response) {
			// console.log('MMM-FroelingConnect: ' + response.data);
			// console.log('MMM-FroelingConnect: ' + response.status);
			// console.log('MMM-FroelingConnect: ' + response.statusText);
			// console.log('MMM-FroelingConnect: ' + response.headers);
			// console.log('MMM-FroelingConnect: ' + response.config);
			// console.log('MMM-FroelingConnect: ' + response.headers["authorization"]);
			// console.log({session: response.data, token: response.headers["authorization"], interval: payload.interval});
			self.froelingAPIerror.status = null;
			self.froelingAPIerror.statusText = null;
			self.sendSocketNotification("MMM-FroelingConnect-Login-OK", {session: response.data, token: response.headers["authorization"], interval: payload.interval});
		}).catch(function (error) {
			//console.log(error.response.status);
			self.froelingAPIerror.status = error.response.status;
			self.froelingAPIerror.statusText = error.response.statusText;
			self.sendSocketNotification("MMM-FroelingConnect-Login-ERROR", {froelingAPIerror: self.froelingAPIerror, interval: payload.interval});
		});
	},

	bootup: async function(payload) {
		const self = this;
		if (payload.token) {
			self.token = payload.token;
			self.session = payload.session;
			await self.getDeviceList();
			await self.updateDevices();
			//console.log(self.componentStates.lastUpdate);
			//console.log(self.componentStates);
			self.sendSocketNotification("MMM-FroelingConnect-newCompontentState", self.componentStates);
			if(self.config.runOwnJsonApiServerInLocalNetwork && !self.ownAPIServerStarted) {
				self.ownAPIServerStarted = true;
				await self.startOwnJsonApiServer();
			}
			self.updateInterval = setInterval(async () => {
				//console.log(self.componentStates.lastUpdate);
				await self.updateDevices();
				self.sendSocketNotification("MMM-FroelingConnect-newCompontentState", self.componentStates);
			}, payload.interval * 60 * 1000);
			self.refreshTokenInterval = setInterval(() => {
				self.login(self.config);
			}, 11.5 * 60 * 60 * 1000);
		}
	},

	mergeComponentStates: async function(current, update) {
		const self = this;
		Object.keys(update).forEach(function(key) {
			// if update[key] exist, and it's not a string or array,
			// we go in one level deeper
			if (current.hasOwnProperty(key)
				&& typeof current[key] === 'object'
				&& !(current[key] instanceof Array)) {
				self.mergeComponentStates(current[key], update[key]);

				// if update[key] doesn't exist in current, or it's a string
				// or array, then assign/overwrite current[key] to update[key]
			} else {
				current[key] = update[key];
			}
		});
		return current;
	},

	getDeviceList: async function() {
		const self = this;
		const urlArray = ["https://connect-api.froeling.com/app/v1.0/resources/user/getFacilities", "https://connect-api.froeling.com/app/v1.0/resources/user/getServiceFacilities"];
		for (const url of urlArray) {
			await self.requestClient({
				method: "get",
				url: url,
				headers: {
					Connection: "keep-alive",
					Accept: "*/*",
					"User-Agent": "Froeling PROD/2107.1 (com.froeling.connect-ios; build:2107.1.01; iOS 14.8.0) Alamofire/4.8.1",
					"Accept-Language": "de",
					Authorization: self.token,
				},
			}).then(async function (response) {
				// console.log('MMM-FroelingConnect: ' + JSON.stringify(response.data));
				console.log('MMM-FroelingConnect: ' + `${response.data.length} devices found`);
				if(response.data.length > 0) {
					for (const device of response.data) {
						const id = device.id.toString();
						if(self.deviceArray.indexOf(id) === -1){
							self.deviceArray.push(id);
							await self.requestClient({
								method: "get",
								url: "https://connect-api.froeling.com/fcs/v1.0/resources/user/" + self.session.userId + "/facility/" + id + "/componentList",
								headers: {
									Connection: "keep-alive",
									Accept: "*/*",
									"User-Agent": "Froeling PROD/2107.1 (com.froeling.connect-ios; build:2107.1.01; iOS 14.8.0) Alamofire/4.8.1",
									"Accept-Language": "de",
									Authorization: self.token,
								},
							}).then(async function (response) {
								// console.log('MMM-FroelingConnect: ' + JSON.stringify(response.data));
								console.log('MMM-FroelingConnect: ' + `${response.data.length} components found`);
								if(response.data.length > 0) {
									let componentArray = [];
									for (const component of response.data) {
										if (!componentArray.find(o => o.id === component.componentId && o.name === component.displayName.replace(/\./g, "").replace(/\ /g, "") + "-" + component.displayCategory)) {
											componentArray.push({
												id: component.componentId,
												name: component.displayName.replace(/\./g, "").replace(/\ /g, "") + "-" + component.displayCategory
											});
										}
									}
									self.componentsArray[id] = componentArray;
								}
							}).catch(function (error) {
								console.log(error);
							});
						}
					}
				}
			}).catch(function (error) {
				console.log(error);
			});
		}
	},

	updateDevices: async function() {
		const self = this;
		const statusArray = [
			{
				path: "details",
				url: "https://connect-api.froeling.com/app/v1.0/resources/facility/getFacilityDetails/$id",
				desc: "Detailed status of the devices and to change the state of the devices",
			},

			{
				path: "errors",
				url: "https://connect-api.froeling.com/app/v1.0/resources/facility/getErrors/$id",
				desc: "Errors of the device",
			},
		];

		const headers = {
			Connection: "keep-alive",
			Accept: "*/*",
			"User-Agent": "Froeling PROD/2107.1 (com.froeling.connect-ios; build:2107.1.01; iOS 14.8.0) Alamofire/4.8.1",
			"Accept-Language": "de",
			Authorization: self.token,
		};

		for (const id of self.deviceArray) {
			for (const element of statusArray) {
				const url = element.url.replace("$id", id);

				await self.requestClient({
					method: "get",
					url: url,
					headers: headers,
				}).then(function (response) {
					//console.log('MMM-FroelingConnect: ' + JSON.stringify(response.data));
					if (!response.data) {
						return;
					}
				}).catch(function (error) {
					console.log(error);
				});
			}

			for (const component of self.componentsArray[id]) {
				const url = "https://connect-api.froeling.com/fcs/v1.0/resources/user/" + self.session.userId + "/facility/" + id + "/component/" + component.id;
				await self.requestClient({
					method: "get",
					url: url,
					headers: headers,
				}).then(function (response) {
					//console.log('MMM-FroelingConnect: ' + JSON.stringify(response.data));
					console.log('MMM-FroelingConnect: Updating component "' + response.data.displayName.toString() + '" to componentStates');
					//console.log(response.data);
					self.lastUpdate = new Date(Date.now());
					let tempLastUpdate = self.lastUpdate;
					self.mergeComponentStates(self.componentStates, {
						lastUpdate: tempLastUpdate.toUTCString(),
						[response.data.componentId.toString()]: {
							name: response.data.displayName.toString(),
							componentId: response.data.componentId.toString(),
							topView: response.data.topView,
							stateView: response.data.stateView
						}
					});

					self.mergeComponentStates(self.ownAPIStateData, {
						lastUpdate: tempLastUpdate.toUTCString(),
						[response.data.displayName
							.toString()
							.toLowerCase()
							.replace(" ", "")
							.replace(":", "")
							.replace(",", "")
							.replace(".", "")
							.replace("ä", "ae")
							.replace("ö", "oe")
							.replace("ü", "ue")
							.replace("ß", "ss")
							]: response.data.stateView
					});
					//self.sendSocketNotification("MMM-FroelingConnect-newCompontentState", self.componentStates);
					//console.log(self.componentStates);
					//console.log(self.ownAPIStateData);
					if (!response.data) {
						return;
					}
				}).catch(function (error) {
					console.log(error);
				});
			}
		}
	},
	
	startOwnJsonApiServer: async function() {
		const self = this;
		const requestListener = function(req, res) {
			res.setHeader("Content-Type", "application/json; charset=utf-8");
			res.writeHead(200);
			res.end(JSON.stringify(self.ownAPIStateData));
		};
		const app = http.createServer(requestListener);
		app.listen(self.config.ownJsonApiServerPort);
	},

	socketNotificationReceived: function (notification, payload) {
		const self = this;
		//console.log('MMM-FroelingConnect: ' + notification);
		if (notification === "MMM-FroelingConnect-Login") {
			self.config = payload;
			self.login(self.config);
		}
		if (notification === "MMM-FroelingConnect-InitDevices") {
			self.bootup(payload);
		}
	}
});