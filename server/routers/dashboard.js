
module.exports.features = function(req, res) {

    var features = {
        navigation: 'Navigation menu',
        biscuits: 'Biscuits'
    }
    
    var opts = {
        title: features[req.params.feature]
    }

    opts[req.params.feature] = true;
    res.render('layout.handlebars', opts);
};
