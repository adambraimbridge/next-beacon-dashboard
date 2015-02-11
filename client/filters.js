var qs = require('query-string');

// Attach events to the Bootstrap filter dropdown menus 
module.exports = function () {
    var query = qs.parse(location.search);

    $('[data-filter].form-control').on('change', function (e) {
        var type = this.options[this.selectedIndex].value;
        var key = $(this).data('filter');
        if (type) {
            query[key] = type;
            if (type === '__clear__') {
                delete query[key];
            }
            location.search = qs.stringify(query);
        }
    }).each(function() {
        var key = $(this).data('filter');
        $(this).val(query[key] || '__clear__');
    });
};
