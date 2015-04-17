
// Routes for APIs

module.exports.api = {};
module.exports.api.query		= require('./api/query');
module.exports.api.export		= require('./api/export');
module.exports.api.addiction	= require('./api/addiction');

// Routes for UIs 

module.exports.table			= require('./table');
module.exports.graph			= require('./graph');
module.exports.addiction		= require('./addiction');
module.exports.optInOut			= require('./opt-in-out');
