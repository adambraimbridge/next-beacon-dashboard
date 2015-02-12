var graphs = require('../graphs.js');
var filters = require('../filters.js');

module.exports.graph = function(req, res) {
    
    var opts = {
        graph: true,
        graphs: graphs,
        filters: filters,
        title: req.query.title || '',   // XSS me
        apiLink: req._parsedUrl.search,
        explain: req.keen_explain
    };

    res.render('main.handlebars', opts);
};