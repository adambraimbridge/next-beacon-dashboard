
var fs = require('fs');

module.exports.search = function (req, res) {
    
    var terms = fs.readFileSync('data/redshift/014-jan-2015', { encoding: 'utf8' });
    var table = terms
        .split("\n")
        .map(function (term) {
            return term.split("\t");
        })

    res.set({
          'Content-Type': 'text/plain'
    });
    res.status(200).send(table.join("\n"));
}
