
var auth			= require('http-auth');
var credentials		= process.env.BASIC_AUTH;

if (!credentials) throw new Error("ft-next-beacon-dashboard BASIC_AUTH env *must* be set");

var user = credentials.split(':')[0];
var pass = credentials.split(':')[1];

var basic = auth.basic({
	realm: "FT"
}, function (username, password, callback) {
	callback(username === user && password === pass);
});

module.exports = auth.connect(basic);
