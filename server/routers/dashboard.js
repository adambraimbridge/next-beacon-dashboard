module.exports.graph = function(req, res) {
    
    var opts = {
        graph: true,
        title: req.query.title || '',   // XSS me
        explain: req.keen_explain.join(', ')
    }
    
    res.render('layout.handlebars', opts);
}

