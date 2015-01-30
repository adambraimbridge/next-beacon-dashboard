
var QueryString = require('query-string');

// Attach events to the Bootstrap filter dropdown menus 
module.exports = function () {

    $('[data-filter-pagetype].btn-group').on('click', function (e) {
        var type = e.target.getAttribute('data-filter-page-type');
        if (type) {
            var qs = QueryString.parse(location.search)
            qs.pageType = type;
            if (type === '__clear__') {
                delete qs.pageType;
            };
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
            location.search = QueryString.stringify(qs);
        }
    })

};
