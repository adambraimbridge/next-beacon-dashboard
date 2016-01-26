module.exports = (counts) => {
	const rate = (a, b) => (a / b * 100).toFixed(2);

	const generate = domain => {
		return {
			'oneToTwo': () => rate(counts.ps2[domain], counts.ps1[domain]),
			'twoToThree': () => rate(counts.ps3[domain], counts.ps2[domain]),
			'oneToThree': () => rate(counts.ps3[domain], counts.ps1[domain])
		};
	};

	return {
		nextAnons: generate('nextAnons'),
		nextAnonsMobile: generate('nextAnonsMobile'),
		ftAnons: generate('ftAnons'),
		ftAnonsMobile: generate('ftAnonsMobile')
	};
};
