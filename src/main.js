
require('es6-promise').polyfill();
require('isomorphic-fetch');

switch (location.pathname) {

    case '/features/summary':
        console.log(1);
        require('./features/uniques').init();
        break;
    case '/features/navigation':
        console.log(2);
        require('./features/navigation').init();
        break;
    default:
        console.log(3);
}
