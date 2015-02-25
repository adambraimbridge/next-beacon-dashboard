
/*

  Find superset of all columns in data set

	- Eg. [{a:1},  {b:2},  {c:3}] => { a: '-', b: '-', c: '-' }

  The node csv writer needs to know *all* potential columns for the
  first item so it can map any subequent values to that column. 

*/

module.exports.columns = function (data) {
	var cols = {}; 
	var d = data
		.forEach(function (d) {
			return Object.keys(d).map(function (a) {
				cols[a] = '-';
			})
		})
	return cols;
}
