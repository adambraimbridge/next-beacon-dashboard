
var QueryString = require('query-string');

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
    
$('[data-filter-pagetype].btn-group').on('click', function (e) {
    var type = e.target.getAttribute('data-filter-page-type');
    if (type) {
        var qs = QueryString.parse(location.search)
        qs.pageType = type;
        console.log(qs, type)
        if (type === '__clear__') {
            delete qs.pageType;
        };
        console.log(qs);
        location.search = QueryString.stringify(qs);
    }
})

$('[data-filter-staff].btn-group').on('click', function (e) {
    var type = e.target.getAttribute('data-filter-staff');
    if (type) {
        var qs = QueryString.parse(location.search)
        qs.isStaff = type;
        if (type === '__clear__') {
            delete qs.isStaff;
        };
        console.log(qs);
        location.search = QueryString.stringify(qs);
    }
})
