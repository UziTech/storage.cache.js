/*
 * Author: Tony Brix, https://tony.brix.ninja
 * License: MIT
 * Version: 0.1.0
 */
;
(function (storage) {
	if (!storage) {
		throw "storage.js is not loaded";
	}
	if (storage.cache && !(delete storage.cache)) {
		throw "Cannot redefine storage.cache";
	}
	if (storage.session.cache && !(delete storage.session.cache)) {
		throw "Cannot redefine storage.session.cache";
	}

	function addCache(storage) {

		storage._.converters.cache = {
			// storage.cache
			matchJSONValue: function (obj) {
				return obj && obj.hasOwnProperty("$cache") && Object.keys(obj).length === 1 && obj.$cache.hasOwnProperty("expires") && obj.$cache.hasOwnProperty("value") && obj.$cache.hasOwnProperty("time") && obj.$cache.hasOwnProperty("refresh") && Object.keys(obj.$cache).length === 4;
			},
			matchObject: function (obj) {
				return obj && obj.hasOwnProperty("expires") && obj.hasOwnProperty("value") && obj.hasOwnProperty("time") && obj.hasOwnProperty("refresh") && Object.keys(obj).length === 4;
			},
			toJSONValue: function (obj) {
				return {
					$cache: {
						expires: storage._.stringify(obj.expires),
						value: storage._.stringify(obj.value),
						time: storage._.stringify(obj.time),
						refresh: storage._.stringify(obj.refresh),
					}
				};
			},
			fromJSONValue: function (obj) {
				// console.log("caller", storage._.converters.cache.fromJSONValue.caller.caller.caller.caller);
				return {
					expires: storage._.parse(obj.$cache.expires),
					value: storage._.parse(obj.$cache.value),
					time: storage._.parse(obj.$cache.time),
					refresh: storage._.parse(obj.$cache.refresh),
				};
			},
			valueFromObject: function (obj, args, callback) {
				var now = new Date().getTime();
				var expired = (obj.expires instanceof Date ? now > obj.expires.getTime() : now > obj.time + obj.expires);

				if (expired) {
					if (!args) {
						return;
					}
					if (obj.refresh) {
						if (callback) {
							return obj.refresh(obj.value, function (value) {
								obj.value = value;
								obj.time = new Date().getTime();
								storage.setItem(args, obj);
								callback(obj.value);
							});
						}
						obj.value = obj.refresh(obj.value);
						obj.time = new Date().getTime();
						storage.setItem(args, obj);
						return obj.value;
					}
					if (callback) {
						return callback();
					}
					return;
				}
				if (callback) {
					callback(obj.value);
				}
				return obj.value;
			}
		};

		Object.defineProperties(storage, {
			cache: {
				get: function () {
					return {
						getItem: function (item, callback) {
							var args;
							if (item instanceof Array) {
								args = item;

								if (typeof callback !== "function") {
									callback = null;
								}
							} else {
								args = Array.apply(null, arguments);

								if (typeof args[args.length - 1] === "function") {
									callback = args.pop();
								} else {
									callback = null;
								}
							}

							var item = storage._.getRawItem(args);

							if (storage._.converters.cache.matchObject(item)) {
								return storage._.converters.cache.valueFromObject(item, args, callback);
							}

							if (args.length === 1) {
								return item;
							}
							var prop = args.pop();
							var ret;
							if (callback) {
								args.push(function (item) {
									callback(item[prop]);
								});
								ret = storage.cache.getItem(args);
								if (ret) {
									return ret[prop];
								}
								return;
							}
							ret = storage.cache.getItem(args);
							if (ret) {
								return ret[prop];
							}
							return;
						},
						setItem: function (options, item, value) {
							var args = Array.apply(null, arguments);

							if (typeof options === "object") {
								args.shift();
							} else {
								options = {};
							}
							options.time = new Date().getTime();
							value = args.pop();

							if (args[0] instanceof Array) {
								args = args[0];
							}

							var obj = storage._.getRawItem(args);
							if (!storage._.converters.cache.matchObject(obj)) {
								obj = {};
							}

							if (options.hasOwnProperty("refresh") && typeof options.refresh === "function") {
								obj.refresh = options.refresh;
							} else if (!obj.hasOwnProperty("refresh") || typeof obj.refresh !== "function") {
								obj.refresh = null;
							}
							if (options.hasOwnProperty("expires") && (typeof options.expires === "number" || options.expires instanceof Date)) {
								obj.expires = options.expires;
							} else if (!obj.hasOwnProperty("expires") || (typeof obj.expires !== "number" && !(obj.expires instanceof Date))) {
								obj.expires = 0;
							}
							obj.time = new Date().getTime();
							obj.value = value;

							return storage.setItem(args, obj);
						}
					};
				}
			}
		});
	}
	addCache(storage);
	addCache(storage.session);

})(window.storage);
