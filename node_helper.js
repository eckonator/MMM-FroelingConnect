const NodeHelper = require('node_helper');
const axios = require('axios').default;

module.exports = NodeHelper.create({

	deviceArray : [],
	componentsArray : {},
	componentStates : {},
	requestClient : axios.create(),
	updateInterval : null,
	refreshTokenInterval : null,
	session : {},
	loginState: false,

	login: async function(payload) {
		var self = this;
		if(Object.keys(self.componentStates).length > 0 && self.componentStates.constructor === Object) {
			self.sendSocketNotification("MMM-FroelingConnect-newCompontentState", self.componentStates);
		};
		if(self.loginState === false) {
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
				//console.log('MMM-FroelingConnect: ' + response.headers["authorization"]);
				self.loginState = true;
				self.sendSocketNotification("MMM-FroelingConnect-Login-OK", {session: response.data, token: response.headers["authorization"], interval: payload.interval});
			}).catch(function (error) {
				self.loginState = false;
				console.log(error);
			});
		}
	},

	bootup: async function(payload) {
		var self = this;
		if (payload.token) {
			self.token = payload.token;
			self.session = payload.session;
			await self.getDeviceList();
			await self.updateDevices();
			//console.log(self.componentStates);
			self.sendSocketNotification("MMM-FroelingConnect-newCompontentState", self.componentStates);
			self.updateInterval = setInterval(async () => {
				await self.updateDevices();
				//console.log(self.componentStates);
				self.sendSocketNotification("MMM-FroelingConnect-newCompontentState", self.componentStates);
			}, payload.interval * 60 * 1000);
			//}, 20 * 1000);
			self.refreshTokenInterval = setInterval(() => {
				self.loginState = false;
				self.login();
			}, 60 * 60 * 1000);
		}
	},

	getDeviceList: async function() {
		var self = this;
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
		var self = this;
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
					self.componentStates = Object.assign({
						[response.data.componentId.toString()]: {
							name: response.data.displayName.toString(),
							componentId: response.data.componentId.toString(),
							topView: response.data.topView,
							stateView: response.data.stateView
						}
					}, self.componentStates);
					//self.sendSocketNotification("MMM-FroelingConnect-newCompontentState", self.componentStates);
					//console.log(self.componentStates)
					if (!response.data) {
						return;
					}
				}).catch(function (error) {
					console.log(error);
				});
			}
		}
	},

	socketNotificationReceived: function (notification, payload) {
		var self = this;
		//console.log('MMM-FroelingConnect: ' + notification);
		if (notification === "MMM-FroelingConnect-Login") {
			self.login(payload);
		}
		if (notification === "MMM-FroelingConnect-InitDevices") {
			self.bootup(payload);
		}
	}
});