/* global Keen, $ */

'use strict';

const queryString = require('querystring');
const queryParameters = queryString.parse(location.search.substr(1));
const drawGraph = require('./ctr/draw-graph');
const drawMetric = require('./ctr/draw-metric');
const config = require('./ctr/config');
const getData = require('./ctr/get-data');



const render = () => {
  const timeframe = queryParameters['timeframe'] || 'this_30_days';
  const interval = timeframe.indexOf('week') > 0 ? 'weekly' : 'daily';

  const promiseOfData = getData(timeframe, interval, config.pageFilter);

  config.metrics.forEach(metric => {

    metric.keenMetricContainer = new Keen.Dataviz()
      .title(metric.title)
      .chartOptions(Object.assign({
          width: '100%'
      }, metric.metricConfig))
      .colors(['#49c5b1'])
      .el(document.querySelector(`.js-front-page-metric[data-metric="${metric.id}"]`))
      .prepare();

    metric.chartEl = new Keen.Dataviz()
        .el(document.querySelector(`.js-front-page-chart[data-metric="${metric.id}"]`))
        .chartType('linechart')
        .title(metric.title)
        .height(450)
        .chartOptions({
            hAxis: {
                format: 'EEE d',
                title: 'Date'
            },
            vAxis: {
                title: metric.title
            },
            trendlines: {
                0: {
                    color: 'green'
                }
            }
        })
        .prepare();
  });


  promiseOfData.then(query => {

  	const getCurrentState = () => {
  		const components = Array.from(document.querySelectorAll('.js-toggle-components:checked') || []).map((el) => el.getAttribute('data-component')).filter(comp => !!comp);
      const layouts = Array.from(document.querySelectorAll('.js-toggle-layout:checked') || []).map((el) => el.getAttribute('data-layout')).filter(layout => !!layout);

      return {
      	components,
      	layouts
      }
  	}

    const draw = ({components, layouts}) => {


      const data = query(components, layouts);
      config.metrics.forEach((metricConfig) => {
        drawMetric(data, metricConfig);
        drawGraph(data, metricConfig);
      });

    }


    draw(getCurrentState());




    $('.js-front-page-toggles').removeClass('is-hidden');

    $('.js-front-page-toggles .toggle-line').change(() => {

    	const state = getCurrentState();

    	if(state.components.length > 1) {
    		$('.js-toggle-layout').attr('type', 'radio');
    		if(state.layouts.length > 1) {
    			state.layouts = state.layouts.slice(0, 1);
    			$('.js-toggle-layout').prop('checked', false);
    			$(`.js-toggle-layout[data-layout="${state.layouts[0]}"]`).prop("checked", true);

    		}

    	} else {
    		$('.js-toggle-layout').attr('type', 'checkbox');
    	}
    	if('requestAnimationFrame' in window) {
    		window.requestAnimationFrame(draw.bind(this, state));
    	} else {
    		setTimeout(draw.bind(this, state), 0);
    	}
    });

  });


  if(!document.location.hash) {
    document.location.hash = '#front-page-ctr-chart'
  }

  const metric = document.querySelector(`.front-page__metric[href="${document.location.hash}"]`);
  if(metric) {
    metric.classList.add('is-selected');
  }

  $('.front-page__metric').on('click', (e) => {
    const selected = document.querySelector('.front-page__metric.is-selected');
    if(selected) {
      selected.classList.remove('is-selected');
    }
    e.currentTarget.classList.add('is-selected');
  });

};

module.exports = {
  render
};
