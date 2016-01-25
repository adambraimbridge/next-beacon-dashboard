google.charts.load('current', {packages: ['corechart', 'bar']});
google.charts.setOnLoadCallback(drawChart);

function drawChart() {
  var data = new google.visualization.DataTable();

  data.addColumn('string', 'Process stage');
  data.addColumn('number', 'Users');

  data.addRows([
    ['PS1', 1000],
    ['PS2', 500],
    ['PS3', 15]
  ]);

  var material = new google.charts.Bar(document.getElementById('chart_div'));
  material.draw(data);

}
