'use strict';

var express         = require('express');
var debug           = require('debug')('beacon-dashboard');
var util            = require('util');
var exphbs          = require('express3-handlebars');
var routers         = require('./routers');

var app = module.exports = express();

app.use(express.static(__dirname + '/../static', { maxAge: 86400000 }));

app.engine('handlebars', exphbs());
app.set('viewine', 'handlebars');

app.get('/__gtg', function(req, res) {
    res.status(200).send();
});

// API routes
var api = express.Router();
api.get('/cta/menu-button', routers.cta.menu); 
api.get('/cta/menu-items', routers.cta.menuItems); 
api.get('/cta/search-button', routers.cta.search); 
api.get('/api/timing/performance/:metric', routers.performance); 
api.get('/api/dwell/:metric', routers.dwell); 

// Dashboard routes
var dashboard = express.Router();
dashboard.get('/', routers.dashboard.index);
dashboard.get('/features/:feature', routers.dashboard.features);

app.use('/api', api)
app.use('/', dashboard)

var port = process.env.PORT || 3001;
app.listen(port, function() {
    console.log("Listening on " + port);
});


