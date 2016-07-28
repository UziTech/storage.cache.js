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

	function addCache(storage) {

		storage.converters.cache = {
			// storage.cache
			matchJSONValue: function (obj) {
				return obj && obj.hasOwnProperty("$cache") && Object.keys(obj).length === 1 && obj.$cache.hasOwnProperty("expires") && obj.$cache.hasOwnProperty("item") && obj.$cache.hasOwnProperty("time") && obj.$cache.hasOwnProperty("refresh") && Object.keys(obj.$cache).length === 4;
			},
			matchObject: function (obj) {
				return obj.hasOwnProperty("expires") && obj.hasOwnProperty("item") && obj.hasOwnProperty("time") && obj.hasOwnProperty("refresh") && Object.keys(obj).length === 4;
			},
			toJSONValue: function (obj) {
				return {
					$cache: {
						expires: storage.stringify(obj.expires),
						item: storage.stringify(obj.item),
						time: storage.stringify(obj.time),
						refresh: storage.stringify(obj.refresh),
					}
				};
			},
			fromJSONValue: function (obj) {
				// console.log("caller", storage.converters.cache.fromJSONValue.caller.caller.caller.caller);
				return {
					expires: storage.parse(obj.$cache.expires),
					item: storage.parse(obj.$cache.item),
					time: storage.parse(obj.$cache.time),
					refresh: storage.parse(obj.$cache.refresh),
				};
			}
		};

		Object.defineProperties(storage, {
			cache: {
				get: function () {
					return {
						getItem: function () {
							var args = Array.apply(null, arguments);

							var callback = null;
							if (typeof args[args.length - 1] === "function") {
								callback = args.pop();
							}

							var item = storage.getItem.apply(storage, args);

							if (typeof item === "undefined") {
								if (callback) {
									callback();
								}
								return;
							} else if (storage.converters.cache.matchObject(item)) {
								var now = new Date().getTime();
								var expired = true;
								if (item.expires instanceof Date) {
									expired = now > item.expires.getTime();
								} else {
									expired = now - item.time > item.expires;
								}

								if (expired) {
									if (item.refresh) {
										if (callback) {
											return item.refresh(item.item, function (newItem) {
												item.item = newItem;
												item.time = new Date().getTime();
												args.push(item);
												storage.setItem.apply(storage, args);
												callback(item.item);
											});
										}
										item.item = item.refresh(item.item);
										item.time = new Date().getTime();
										args.push(item);
										storage.setItem.apply(storage, args);
										return item.item;
									}
									if (callback) {
										callback();
									}
									return;
								} else {
									if (callback) {
										callback(item.item);
									} else {
										return item.item;
									}
								}
							} else {
								throw "Not a cached object";
							}
						},
						setItem: function () {
							if (arguments.length < 2) {
								throw "No value given";
							}

							var item = {
								item: null,
								time: new Date().getTime(),
								expires: null,
								refresh: null,
							};

							var args = Array.apply(null, arguments);

							if (arguments.length > 3 && typeof args[args.length - 1] === "function") {
								item.refresh = args.pop();
							}

							if (arguments.length > 2 && (typeof args[args.length - 1] === "number" || args[args.length - 1] instanceof Date)) {
								item.expires = args.pop();
							} else {
								throw "No expiration time given";
							}

							item.item = args[args.length - 1];
							args[args.length - 1] = item;

							return storage.setItem.apply(storage, args);
						}
					};
				}
			}
		});
	}
	addCache(storage);
	addCache(storage.session);

})(window.storage);
