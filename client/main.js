
var Filters = require('./filters')();

switch (location.pathname) {
    case '/graph':
        require('./features/graph').init();
        break;
    default:
        console.info('This route seems to have no corresponding javascript');
}

