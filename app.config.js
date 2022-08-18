export default ({ config }) => {

	if (!config.extra) {
		config.extra = {};
	}

	config.extra.experienceId = '@' + config.owner + '/' + config.slug;

	return config;
};
