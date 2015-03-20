var graphs = require('../graphs.js');
var ctas = require('../ctas.js');
var filters = require('../filters.js');

module.exports = function(req, res) {
    
    var opts = {
        graph: true,
        graphs: graphs,
        ctas: ctas,
        filters: filters,
        title: req.query.title || '',   // XSS me
        apiLink: req._parsedUrl.search,
        explain: req.keen_explain
    };

    res.render('main.handlebars', opts);
};
