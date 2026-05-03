const NodeHelper = require('node_helper');
const axios = require('axios').default;
const http = require('node:http');

const LOG_PREFIX = "MMM-FroelingConnect: ";
const FROELING_USER_AGENT = "Froeling PROD/2107.1 (com.froeling.connect-ios; build:2107.1.01; iOS 14.8.0) Alamofire/4.8.1";
const LOGIN_URL = "https://connect-api.froeling.com/app/v1.0/resources/loginNew";
const FACILITIES_URLS = [
	"https://connect-api.froeling.com/app/v1.0/resources/user/getFacilities",
	"https://connect-api.froeling.com/app/v1.0/resources/user/getServiceFacilities",
];

module.exports = NodeHelper.create({

	config: {},
	deviceArray: [],
	componentsArray: {},
	componentStates: {},
	requestClient: axios.create(),
	updateInterval: null,
	refreshTokenInterval: null,
	session: {},
	froelingAPIerror: {
		status: null,
		statusText: null
	},
	ownAPIStateData: {},
	ownAPIServerStarted: false,
	lastUpdate: new Date(),

	_buildHeaders: function(withAuth) {
		const headers = {
			Connection: "keep-alive",
			Accept: "*/*",
			"User-Agent": FROELING_USER_AGENT,
			"Accept-Language": "de",
		};
		if (withAuth) {
			headers.Authorization = this.token;
		}
		return headers;
	},

	login: async function(payload) {
		const self = this;
		if (Object.keys(self.componentStates).length > 0) {
			self.sendSocketNotification("MMM-FroelingConnect-newCompontentState", self.componentStates);
		}
		try {
			const response = await self.requestClient({
				method: "post",
				url: LOGIN_URL,
				headers: {
					...self._buildHeaders(false),
					"Content-Type": "application/json",
				},
				data: JSON.stringify({
					osType: "IOS",
					userName: payload.username,
					password: payload.password,
				}),
			});
			self.froelingAPIerror.status = null;
			self.froelingAPIerror.statusText = null;
			console.log(LOG_PREFIX + "Login successful");
			self.sendSocketNotification("MMM-FroelingConnect-Login-OK", {
				session: response.data,
				token: response.headers["authorization"],
				interval: payload.interval,
			});
		} catch (error) {
			console.error(LOG_PREFIX + "Login failed: " + error.response?.status + " " + error.response?.statusText);
			self.froelingAPIerror.status = error.response?.status ?? null;
			self.froelingAPIerror.statusText = error.response?.statusText ?? null;
			self.sendSocketNotification("MMM-FroelingConnect-Login-ERROR", {
				froelingAPIerror: self.froelingAPIerror,
				interval: payload.interval,
			});
		}
	},

	// Refreshes the auth token without triggering the full bootup cycle,
	// which would otherwise create duplicate update intervals on each refresh.
	refreshToken: async function() {
		const self = this;
		try {
			const response = await self.requestClient({
				method: "post",
				url: LOGIN_URL,
				headers: {
					...self._buildHeaders(false),
					"Content-Type": "application/json",
				},
				data: JSON.stringify({
					osType: "IOS",
					userName: self.config.username,
					password: self.config.password,
				}),
			});
			self.token = response.headers["authorization"];
			console.log(LOG_PREFIX + "Token refreshed successfully");
		} catch (error) {
			console.error(LOG_PREFIX + "Token refresh failed: " + error.message);
		}
	},

	bootup: async function(payload) {
		const self = this;
		if (!payload.token) {
			return;
		}
		self.token = payload.token;
		self.session = payload.session;
		await self.getDeviceList();
		await self.updateDevices();
		self.sendSocketNotification("MMM-FroelingConnect-newCompontentState", self.componentStates);
		if (self.config.runOwnJsonApiServerInLocalNetwork && !self.ownAPIServerStarted) {
			self.ownAPIServerStarted = true;
			await self.startOwnJsonApiServer();
		}
		clearInterval(self.updateInterval);
		self.updateInterval = setInterval(async () => {
			await self.updateDevices();
			self.sendSocketNotification("MMM-FroelingConnect-newCompontentState", self.componentStates);
		}, payload.interval * 60 * 1000);
		clearInterval(self.refreshTokenInterval);
		self.refreshTokenInterval = setInterval(() => {
			self.refreshToken();
		}, 11.5 * 60 * 60 * 1000);
	},

	mergeComponentStates: function(current, update) {
		const self = this;
		Object.keys(update).forEach(function(key) {
			if (Object.prototype.hasOwnProperty.call(current, key)
				&& typeof current[key] === 'object'
				&& !(current[key] instanceof Array)) {
				self.mergeComponentStates(current[key], update[key]);
			} else {
				current[key] = update[key];
			}
		});
	},

	getDeviceList: async function() {
		const self = this;
		const headers = self._buildHeaders(true);
		for (const url of FACILITIES_URLS) {
			try {
				const facilityResponse = await self.requestClient({ method: "get", url, headers });
				console.log(LOG_PREFIX + facilityResponse.data.length + " devices found at " + url);
				for (const device of facilityResponse.data) {
					const id = device.id.toString();
					if (self.deviceArray.includes(id)) {
						continue;
					}
					self.deviceArray.push(id);
					try {
						const componentUrl = "https://connect-api.froeling.com/fcs/v1.0/resources/user/"
							+ self.session.userId + "/facility/" + id + "/componentList";
						const componentResponse = await self.requestClient({ method: "get", url: componentUrl, headers });
						console.log(LOG_PREFIX + componentResponse.data.length + " components found for device " + id);
						const componentArray = [];
						for (const component of componentResponse.data) {
							const name = component.displayName.replace(/\./g, "").replace(/ /g, "") + "-" + component.displayCategory;
							if (!componentArray.find(o => o.id === component.componentId && o.name === name)) {
								componentArray.push({ id: component.componentId, name });
							}
						}
						self.componentsArray[id] = componentArray;
					} catch (error) {
						console.error(LOG_PREFIX + "Failed to fetch components for device " + id + ": " + error.message);
					}
				}
			} catch (error) {
				console.error(LOG_PREFIX + "Failed to fetch facilities from " + url + ": " + error.message);
			}
		}
	},

	updateDevices: async function() {
		const self = this;
		const headers = self._buildHeaders(true);
		for (const id of self.deviceArray) {
			for (const component of self.componentsArray[id]) {
				const url = "https://connect-api.froeling.com/fcs/v1.0/resources/user/"
					+ self.session.userId + "/facility/" + id + "/component/" + component.id;
				try {
					const response = await self.requestClient({ method: "get", url, headers });
					const data = response.data;
					console.log(LOG_PREFIX + 'Updating component "' + data.displayName + '"');
					self.lastUpdate = new Date();
					self.mergeComponentStates(self.componentStates, {
						lastUpdate: self.lastUpdate.toUTCString(),
						[data.componentId.toString()]: {
							name: data.displayName.toString(),
							componentId: data.componentId.toString(),
							topView: data.topView,
							stateView: data.stateView,
						}
					});
					self.mergeComponentStates(self.ownAPIStateData, {
						lastUpdate: self.lastUpdate.toUTCString(),
						[data.displayName
							.toString()
							.toLowerCase()
							.replace(/ /g, "")
							.replace(/:/g, "")
							.replace(/,/g, "")
							.replace(/\./g, "")
							.replace(/ä/g, "ae")
							.replace(/ö/g, "oe")
							.replace(/ü/g, "ue")
							.replace(/ß/g, "ss")
						]: data.stateView
					});
				} catch (error) {
					console.error(LOG_PREFIX + 'Failed to update component "' + component.name + '": ' + error.message);
				}
			}
		}
	},

	startOwnJsonApiServer: async function() {
		const self = this;
		const app = http.createServer(function(req, res) {
			res.setHeader("Content-Type", "application/json; charset=utf-8");
			res.writeHead(200);
			res.end(JSON.stringify(self.ownAPIStateData));
		});
		app.listen(self.config.ownJsonApiServerPort, () => {
			console.log(LOG_PREFIX + "JSON API server listening on port " + self.config.ownJsonApiServerPort);
		});
	},

	socketNotificationReceived: function(notification, payload) {
		const self = this;
		if (notification === "MMM-FroelingConnect-Login") {
			self.config = payload;
			self.login(self.config);
		}
		if (notification === "MMM-FroelingConnect-InitDevices") {
			self.bootup(payload);
		}
	},
});
