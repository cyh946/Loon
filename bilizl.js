const Group = $.read('BiliArea_Policy') || '港台番剧';
const getPolicy = (groupName) => {
		if (isLoon) {
			if (typeof ($config.getPolicy) === 'undefined') return 3;
			const getName = $config.getPolicy(groupName);
			return getName || 2;
		}
		if (isQuanX) {
			if (typeof ($configuration) === 'undefined') return 3;
			return new Promise((resolve) => {
				$configuration.sendMessage({
					action: "get_policy_state"
				}).then(b => {
					if (b.ret && b.ret[groupName]) {
						resolve(b.ret[groupName][1]);
					} else resolve(2);
				}, () => resolve());
			})
		}
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