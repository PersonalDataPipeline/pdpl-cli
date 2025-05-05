import { writeFileSync } from "node:fs";
import { DbBaseCommand } from "./_base.js";

interface StravaResult {
  sport_type: string;
  year: string;
  distance: number;
}

export default class Graph extends DbBaseCommand<typeof DbBaseCommand> {
  static override summary = "Generate graphs from stored data";
  static override hidden = true;

  public async run(): Promise<void> {
    const results = (await this.dbConn.all(`
      SELECT sport_type, SUM(distance) AS distance, strftime(start_date, '%Y') AS year
      FROM pdpl.main."strava__athlete--activities"
      GROUP BY year, sport_type
      ORDER BY year
    `)) as StravaResult[];

    const sportTypes: string[] = [];
    const years: number[] = [];
    const seriesData: Record<string, number> = {};
    for (const result of results) {
      seriesData[`${result.sport_type}:${result.year}`] = Math.round(
        result.distance * 0.000621371
      );
      if (!sportTypes.includes(result.sport_type)) {
        sportTypes.push(result.sport_type);
      }
      const thisYear = parseInt(result.year, 10);
      if (!years.includes(thisYear)) {
        years.push(thisYear);
      }
    }

    if (!years.length) {
      throw new Error(`❌ No years`);
    }

    const xAxisLabels = [];
    const chartSeries: Record<string, { name: string; data: number[] }> = {};
    for (let year = years.at(0) || 1979; year <= years.at(-1)!; year++) {
      xAxisLabels.push(year);
      sportTypes.forEach((type) => {
        if (!chartSeries[type]) {
          chartSeries[type] = {
            name: type,
            data: [],
          };
        }
        chartSeries[type].data.push(seriesData[`${type}:${year}`] || 0);
      });
    }

    const chartData = {
      title: {
        text: "Strava exercise types",
      },
      tooltip: {
        trigger: "axis",
        axisPointer: {
          type: "cross",
          label: {
            backgroundColor: "#6a7985",
          },
        },
      },
      legend: {
        data: sportTypes,
      },
      toolbox: {
        feature: {
          saveAsImage: {},
        },
      },
      grid: {
        left: "3%",
        right: "4%",
        bottom: "3%",
        containLabel: true,
      },
      xAxis: [
        {
          type: "category",
          boundaryGap: false,
          data: xAxisLabels,
        },
      ],
      yAxis: [
        {
          type: "value",
        },
      ],
      series: Object.values(chartSeries).map((series) => ({
        ...series,
        type: "line",
        stack: "Total",
        areaStyle: {},
        emphasis: {
          focus: "series",
        },
      })),
    };

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Stacked Area Chart - Apache ECharts Demo</title>
  <style>
  * { margin: 0; padding: 0 }
  #chart-container { position: relative; height: 100vh; overflow: hidden}
  </style>
</head>
<body>
  <div id="chart-container"></div>
  <script src="https://echarts.apache.org/en/js/vendors/echarts/dist/echarts.min.js"></script>
  <script>
    const chartData = ${JSON.stringify(chartData)};
    const chartContainer = document.getElementById('chart-container');
    const myChart = echarts.init(chartContainer, "dark", {
      renderer: 'canvas',
      useDirtyRect: false
    });
    myChart.setOption(chartData);
    window.addEventListener('resize', myChart.resize);
  </script>
</body>
</html>`;

    writeFileSync("/Users/joshcanhelp/Code/pdpl/graphs/stacked.html", html, {
      encoding: "utf8",
    });
  }
}
