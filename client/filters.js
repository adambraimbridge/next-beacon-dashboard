
var QueryString = require('query-string');

// Attach events to the Bootstrap filter dropdown menus 
module.exports = function () {

    $('[data-filter-pagetype].form-control').on('change', function (e) {
        var type = this.options[this.selectedIndex].value;
        if (type) {
            var qs = QueryString.parse(location.search)
            qs.pageType = type;
            if (type === '__clear__') {
                delete qs.pageType;
            };
            location.search = QueryString.stringify(qs);
        }
    })

    $('[data-filter-staff].form-control').on('change', function (e) {
        var type = this.options[this.selectedIndex].value;
        if (type) {
            var qs = QueryString.parse(location.search)
            qs.isStaff = type;
            if (type === '__clear__') {
                delete qs.isStaff;
            };
            location.search = QueryString.stringify(qs);
        }
    })

    $('[data-filter-timeframe].form-control').on('change', function (e) {
        var type = this.options[this.selectedIndex].value;
        if (type) {
            var qs = QueryString.parse(location.search)
            qs.timeframe = type;
            if (type === '__clear__') {
                delete qs.timeframe;
            };
            location.search = QueryString.stringify(qs);
        }
    })
    
    $('[data-filter-interval].form-control').on('change', function (e) {
        var type = this.options[this.selectedIndex].value;
        if (type) {
            var qs = QueryString.parse(location.search)
            qs.interval = type;
            if (type === '__clear__') {
                delete qs.interval;
            };
            location.search = QueryString.stringify(qs);
        }
    })

    var qs = QueryString.parse(location.search);

    if (qs.isStaff) {
        $('[data-filter-staff].form-control').val(qs.isStaff);
    } else {
        $('[data-filter-staff].form-control').val('__clear__');
    }

    if (qs.pageType) {
        $('[data-filter-pagetype].form-control').val(qs.pageType);
    } else {
        $('[data-filter-pagetype].form-control').val('__clear__');
    }
    
    if (qs.timeframe) {
        $('[data-filter-timeframe].form-control').val(qs.timeframe);
    } else {
        $('[data-filter-timeframe].form-control').val('__clear__');
    }
    
    if (qs.interval) {
        $('[data-filter-interval].form-control').val(qs.interval);
    } else {
        $('[data-filter-interval].form-control').val('__clear__');
    }
};
