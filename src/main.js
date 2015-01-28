

switch (location.pathname) {

    case '/features/summary':
        require('./features/uniques').init();
        break;
    case '/features/navigation':
        require('./features/navigation').init();
        break;
    default:
        console.info('This route seems to have no corresponding javascript');
}
