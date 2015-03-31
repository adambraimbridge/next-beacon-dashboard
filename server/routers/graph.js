var conf = require('../conf'); 

module.exports = function(req, res) {
    
    var opts = {
        graph: true,
        graphs: conf.graphs,
        ctas: conf.ctas,
        optInOuts: conf.optInOuts,
        filters: conf.filters,
        title: req.query.title || '',   // XSS me
        apiLink: req._parsedUrl.search,
        explain: req.keen_explain
    };

    res.render('main.handlebars', opts);
};
