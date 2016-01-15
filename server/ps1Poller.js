const Poller = require("ft-poller");
const conversionParser = require('./conversionfunnel');
var aws4 = require('aws4');

const hostname = 'ft-next-redshift.s3.amazonaws.com';

const signed = aws4.sign({
  service: 's3',
  hostname: hostname,
  path: '/conversion-funnel-one.json',
  signQuery: true,
  timeout: 1200000,
  region: 'eu-west-1'
}, {
  accessKeyId: process.env.S3_AWS_ACCESS,
  secretAccessKey: process.env.S3_AWS_SECRET
});

const url = `https://${hostname}${signed.path}`;
const options = signed;

var pollerData = [];
var poller = new Poller({
  url: url,
  options: { timeout: 12000000 },
  parseData: function (data) {
    console.log('p1 data');
    data = JSON.parse(data);
    pollerData = conversionParser(data);
  }
});

module.exports = {
  start: function() {
    console.log('========================started poller1', url, options);
    poller.start.bind(poller, { initialRequest: true });
    poller.on('error', function (err) {
      console.log(err);
    });
  },
  getData: function () {
    return pollerData;
  }
};
