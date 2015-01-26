
module.exports.init = function () {

    fetch('/api/dwell/uniques?interval=daily&timeframe=this_7_days&excludeStaff=false')
        .then(function(response) {
            if (response.status >= 400) {
                throw new Error("Bad response from server");
            }
            return response.json();
        })
        .then(function(data) {

            console.log(data);

            // ...
            var html = data.result.reverse().map(function (day) {
                var daysAgo = parseInt((new Date() - new Date(day.timeframe.start)) / 24 / 60 / 60 / 1000);
                var dateDisplay = (daysAgo < 1) ? 'today' : daysAgo + ' days ago';
                return '<li>' + 
                            '<big>' + day.value +' people</big>' +
                                ' ' +
                            '<time datetime="' + day.timeframe.start + '">' +
                                dateDisplay
                            '</time>' +
                        '</li>';
            }).join('');
           
            document.getElementById('uniques').innerHTML = html;
             
        });

};
