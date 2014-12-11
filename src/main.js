
var reqwest = require('reqwest');

// /users/by/browser.family,browser.major

reqwest('/users/by/browser.family,browser.major', function (resp) {
    var el = document.getElementById('browsers');
    el.innerHTML = resp.result.map(function (b) {
        return '<li>' + [b['browser.family'], b['browser.major'], b.result].join(' ') + '</li>'
    }).join('');
});


reqwest('/users/by/content.genre', function (resp) {
    var el = document.getElementById('genre');
    el.innerHTML = resp.result.map(function (b) {
        return '<li>' + [b['content.genre'], b.result].join(' ') + '</li>'
    }).join('');
});


reqwest('/users/by/country', function (resp) {
    var el = document.getElementById('country');
    el.innerHTML = resp.result.map(function (b) {
        return '<li>' + [b['country'], b.result].join(' ') + '</li>'
    }).join('');
});

