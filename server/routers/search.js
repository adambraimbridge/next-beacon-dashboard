
module.exports = function (req, res) {

	var isUser = /^([0-9]+)$/.test(req.query.q);
	var isContent = /^([\d\w]+)-([\d\w]+)/.test(req.query.q);
	
	if (isUser) {
		var user = '&erights=' + req.query.q;
		var title = '&title=Page views: User ' + req.query.q;
		res.redirect('/graph?event_collection=dwell&metric=count&group_by=page.location.type' + user + title);
	} else if (isContent) {
		res.redirect('/content?event_collection=dwell&group_by=page.referrer.hostname&metric=count&uuid=' + req.query.q);
	} else {
		res.send('?');
	}

	// TODO 
	//	- dwell by page type - http://localhost:3001/graph?event_collection=dwell&metric=count&group_by=page.location.type&erights=10620249
	//	- devices - http://localhost:3001/graph?event_collection=dwell&metric=count&group_by=user.deviceType&erights=10620249
	//	- locations - http://localhost:3001/graph?event_collection=dwell&metric=count&group_by=user.geo.city&erights=10620249
	// event_collection=dwell&metric=count&group_by=page.location.type&erights=3266367&title=Unique%20users%20for%20user:3266367
}
