
module.exports.features = function(req, res) {

    var features = {
        summary: 'Summary',
        adverts: 'Adverts',
        article: 'Article',
        cards: 'Article cards',
        follow: 'Follow',
        my: 'My page',
        navigation: 'Navigation menu',
        performance: 'Page speed',
        related: 'Related',
        recommended: 'Recommended',
        saveforlater: 'Save for later',
        search: 'Search',
        slideshows: 'Galleries & slideshows',
        video: 'Video'
    }
    
    var opts = {
        title: features[req.params.feature]
    }

    opts[req.params.feature] = true;
    res.render('layout.handlebars', opts);
};
