const Poller = require("ft-poller");
const conversionParser = require('./conversionfunnel');
var aws4 = require('aws4');

const hostname = 'ft-next-redshift.s3.amazonaws.com';

const signed = aws4.sign({
  service: 's3',
  hostname: hostname,
  path: '/conversion-funnel-one.json',
  signQuery: true,
  timeout: 60000,
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
  parseData: function (data) {
    console.log('polled 1 received');
	data = JSON.parse(data);
	pollerData = conversionParser(data);
  }
});

module.exports = {
  start: poller.start.bind(poller, { initialRequest: true }),
  getData: function () {
    return pollerData;
  }
};
