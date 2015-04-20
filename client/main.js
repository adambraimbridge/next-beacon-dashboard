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
		break;
	case '/opt-in-out':
		require('./features/opt-in-out').init();
		break;
	default:
		console.info('This route seems to have no corresponding javascript');
}
