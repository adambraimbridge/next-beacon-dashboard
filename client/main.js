
var Filters = require('./filters')();

switch (location.pathname) {
    case '/graph':
        require('./features/graph').init();
        break;
    case '/opt-in-out':
        require('./features/opt-in-out').init();
        break;
    default:
        console.info('This route seems to have no corresponding javascript');
}

