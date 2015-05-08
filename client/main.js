'use strict';

require('./filters')();

switch (location.pathname) {
	case '/addiction':
		require('./features/addiction').init();
		break;
	case '/search':
		require('./features/search').init();
		break;
	case '/graph':
	case '/content':
		require('./features/graph').init();
		require('./features/ab').init();
		break;
	case '/opt-in-out':
		require('./features/opt-in-out').init();
		break;
	case '/flow':
		require('./features/flow').init();
		break;
	case '/components':
		require('./features/components').init();
		break;
	default:
		console.info('This route seems to have no corresponding javascript');
}
