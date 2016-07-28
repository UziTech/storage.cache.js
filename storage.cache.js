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
		throw "Cannot add storage.cache";
	}

	function addCache(storage) {

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

							if (item && item.hasOwnProperty("expires") && item.hasOwnProperty("item") && item.hasOwnProperty("time") && item.hasOwnProperty("refreshFunc")) {
								var now = new Date().getTime();
								if (now - item.time > item.expires) {
									if (item.refreshFunc) {
										if (callback) {
											item.refreshFunc(function (newItem) {
												item.item = newItem;
												item.time = new Date().getTime();
												args.push(item);
												storage.setItem.apply(storage, args);
												callback(item.item);
											});
										} else {
											item.item = item.refreshFunc();
											item.time = new Date().getTime();
											args.push(item);
											storage.setItem.apply(storage, args);
											return item.item;
										}
									} else {
										if (callback) {
											callback();
										}
									}
								} else {
									if (callback) {
										callback(item.item);
									} else {
										return item.item;
									}
								}
							} else {
								if (callback) {
									callback();
								}
							}
						},
						setItem: function () {
							if (arguments.length < 2) {
								throw "Not enough args";
							}

							var item = {
								item: null,
								time: new Date().getTime(),
								expires: null,
								refreshFunc: null,
							};

							var args = Array.apply(null, arguments);

							if (arguments.length > 2 && typeof args[args.length - 1] === "function") {
								item.refreshFunc = args.pop();
							}

							if (arguments.length > 2 && typeof args[args.length - 1] === "number") {
								item.expires = args.pop();
							} else {
								// default to 1 day
								item.expires = 1000 * 60 * 60 * 24;
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
