'use strict';

var express         = require('express');
var debug           = require('debug')('beacon-dashboard');
var util            = require('util');
var exphbs          = require('express3-handlebars');
var routers         = require('./routers');

var app = module.exports = express();

app.use(express.static(__dirname + '/../static', { maxAge: 3600000 }));

app.engine('handlebars', exphbs());
app.set('viewine', 'handlebars');

app.get('/__gtg', function(req, res) {
    res.status(200).send();
});

var cacheControl = function (req, res, next) {
    res.header('Cache-Control', 'max-age=120');
    next();
}

// API routes
var api = express.Router();
api.use(cacheControl);
api.get('/cta/menu-button', routers.cta.menu);
api.get('/cta/menu-items', routers.cta.menuItems);
api.get('/cta/search-button', routers.cta.search);
api.get('/cta/article-card', routers.cta.articleCards);
api.get('/timing/performance/:metric', routers.performance); 
api.get('/dwell/:metric', routers.dwell); 

// Dashboard routes
var dashboard = express.Router();
dashboard.get('/features/:feature', routers.dashboard.features);

var data = express.Router();
data.get('/:source', routers.data.search);

app.use('/api', api);
app.use('/data', data);
app.use('/', dashboard);

app.get('/', function (req, res) {
    res.redirect(302, '/features/summary');
})

var port = process.env.PORT || 3001;
app.listen(port, function() {
    console.log("Listening on " + port);
});
