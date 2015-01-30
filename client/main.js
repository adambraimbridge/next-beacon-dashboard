
var Filters = require('./filters');

switch (location.pathname) {
    case '/features/graph':
        require('./features/graph').init();
        break;
    default:
        console.info('This route seems to have no corresponding javascript');
}

