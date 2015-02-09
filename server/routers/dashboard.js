module.exports.graph = function(req, res) {
    
    var opts = {
        graph: true,
        title: req.query.title || '',   // XSS me
        apiLink: req._parsedUrl.search,
        explain: req.keen_explain.join(', ')
    }

    res.render('layout.handlebars', opts);
}

module.exports.addiction = function(req, res) {
    
    var opts = {
        graph: true,
        title: req.query.title || '',   // XSS me
        apiLink: req._parsedUrl.search,
        explain: req.keen_explain.join(', ')
    }

    res.render('addiction.handlebars', opts);
}
