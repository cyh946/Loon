let $ = nobyda();

async function SwitchRegion(play) {
	const Group = $.read('BiliArea_Policy') || '港台番剧'; //Your blibli policy group name.
	const CN = $.read('BiliArea_CN') || 'DIRECT'; //Your China sub-policy name.
	const TW = $.read('BiliArea_TW') || '台湾节点'; //Your Taiwan sub-policy name.
	const HK = $.read('BiliArea_HK') || '香港节点'; //Your HongKong sub-policy name.
	const DF = $.read('BiliArea_DF') || ''; //Sub-policy name used after region is blocked(e.g. url 404)
	const off = $.read('BiliArea_disabled') || 'DIRECT'; //WiFi blacklist(disable region change), separated by commas.
	const current = await $.getPolicy(Group);
	const area = (() => {
		let select;
		if (/\u6e2f[\u4e00-\u9fa5]+\u5340|%20%E6%B8%AF&/.test(play)) {
			const test = /\u53f0[\u4e00-\u9fa5]+\u5340/.test(play);
			if (current != HK && (current == TW && test ? 0 : 1)) select = HK;
		} else if (/\u53f0[\u4e00-\u9fa5]+\u5340|%20%E5%8F%B0&/.test(play)) {
			if (current != TW) select = TW;
		} else if (play === -404) {
			if (current != DF) select = DF;
		} else if (current != CN) {
			select = CN;
		}
		if ($.isQuanX && current === 'direct' && select === 'DIRECT') {
			select = null; //avoid loops in some cases
		}
		return select;
	})()

	if (area && !off.includes($.ssid || undefined)) {
		const change = await $.setPolicy(Group, area);
		const notify = $.read('BiliAreaNotify') === 'true';
		const msg = SwitchStatus(change, current, area);
		if (!notify) {
			$.notify((/^(http|-404)/.test(play) || !play) ? `` : play, ``, msg);
		} else {
			console.log(`${(/^(http|-404)/.test(play) || !play) ? `` : play}\n${msg}`);
		}
		if (change) {
			return true;
		}
	}
	return false;
}


function nobyda() {
	const isHTTP = typeof $httpClient != "undefined";
	const isLoon = typeof $loon != "undefined";
	const isQuanX = typeof $task != "undefined";
	const isSurge = typeof $network != "undefined" && typeof $script != "undefined";
	const ssid = (() => {
		if (isQuanX && typeof ($environment) !== 'undefined') {
			return $environment.ssid;
		}
		if (isSurge && $network.wifi) {
			return $network.wifi.ssid;
		}
		if (isLoon) {
			return JSON.parse($config.getConfig()).ssid;
		}
	})();
	const notify = (title, subtitle, message) => {
		console.log(`${title}\n${subtitle}\n${message}`);
		if (isQuanX) $notify(title, subtitle, message);
		if (isHTTP) $notification.post(title, subtitle, message);
	}
	const read = (key) => {
		if (isQuanX) return $prefs.valueForKey(key);
		if (isHTTP) return $persistentStore.read(key);
	}
	const adapterStatus = (response) => {
		if (!response) return null;
		if (response.status) {
			response["statusCode"] = response.status;
		} else if (response.statusCode) {
			response["status"] = response.statusCode;
		}
		return response;
	}
	const setPolicy = (group, policy) => {
		if (isLoon && typeof ($config.getPolicy) !== 'undefined') {
			const set = $config.setSelectPolicy(group, "direct");
			return set || 0;
		}
		if (isQuanX && typeof ($configuration) !== 'undefined') {
			return new Promise((resolve) => {
				$configuration.sendMessage({
					action: "set_policy_state",
					content: {
						[group]: "direct"
					}
				}).then((b) => resolve(!b.error || 0), () => resolve());
			})
		}
	}
	const get = (options, callback) => {
		if (isQuanX) {
			options["method"] = "GET";
			$task.fetch(options).then(response => {
				callback(null, adapterStatus(response), response.body)
			}, reason => callback(reason.error, null, null))
		}
		if (isHTTP) {
			if (isSurge) options.headers['X-Surge-Skip-Scripting'] = false;
			$httpClient.get(options, (error, response, body) => {
				callback(error, adapterStatus(response), body)
			})
		}
	}
	return {
		getPolicy,
		setPolicy,
		isSurge,
		isQuanX,
		isLoon,
		notify,
		read,
		ssid,
		get
	}
}