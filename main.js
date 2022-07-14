async (dataString) => {
  const parsedData = JSON.parse(dataString);
  if (!parsedData) return;
  const {
    VisualTrackDatas,
    Events: events,
    MeasuredStationingStart: StationingStart,
    MeasuredStationingEnd: StationingEnd,
    PageWidth,
    PageHeight,
    DefectScale,
    SignalScale,
    DisplayEvents,
    SeverityLimits: chartThresholds,
    TwistBaseLength,
    LocalizationScale,
    StationingLabels,
  } = parsedData;
  const widthRatio = LocalizationScale / 100;
  const chartContainerWrapper = document.createElement("div");
  chartContainerWrapper.classList.add("chartContainerWrapper");
  const chartContainer = document.createElement("div");
  const chartContainerClass = "chartContainer" + StationingStart.toFixed(0);
  chartContainer.classList.add("chartContainer");
  chartContainer.classList.add(chartContainerClass);
  chartContainerWrapper.append(chartContainer);
  document.getElementById("defectChartReport").append(chartContainerWrapper);
  const chartTypes = [
    {
      id: "VersineVerticalRight",
      shortName: "VVR",
      shouldShow: false,
      limitName: "VerticalAlignment",
      limitType: "VersineLimits",
      columnName: "Versine Vertical Right",
    },
    {
      id: "VersineVerticalLeft",
      shortName: "VVL",
      shouldShow: false,
      limitName: "VerticalAlignment",
      limitType: "VersineLimits",
      columnName: "Versine Vertical Left",
    },
    {
      id: "VersineHorizontalRight",
      shortName: "VHR",
      shouldShow: false,
      limitName: "HorizontalAlignment",
      limitType: "VersineLimits",
      columnName: "Versine Horizontal Right",
    },
    {
      id: "VersineHorizontalLeft",
      shortName: "VHL",
      shouldShow: false,
      limitName: "HorizontalAlignment",
      limitType: "VersineLimits",
      columnName: "Versine Horizontal Left",
    },
    {
      id: "LongitudinalLevelD2Right",
      shortName: "LLD2R",
      shouldShow: false,
      limitName: "VerticalAlignment",
      limitType: "D2Limits",
      columnName: "Longitudinal Level Right",
    },
    {
      id: "LongitudinalLevelD2Left",
      shortName: "LLD2L",
      shouldShow: false,
      limitName: "VerticalAlignment",
      limitType: "D2Limits",
      columnName: "Longitudinal Level Left",
    },
    {
      id: "LongitudinalLevelD1Right",
      shortName: "LLD1R",
      shouldShow: false,
      limitName: "VerticalAlignment",
      limitType: "D1Limits",
      columnName: "Longitudinal Level Right",
    },
    {
      id: "LongitudinalLevelD1Left",
      shortName: "LLD1L",
      shouldShow: false,
      limitName: "VerticalAlignment",
      limitType: "D1Limits",
      columnName: "Longitudinal Level Left",
    },
    {
      id: "AlignmentD2Right",
      shortName: "AD2R",
      shouldShow: false,
      limitName: "HorizontalAlignment",
      limitType: "D2Limits",
      columnName: "Alignment Right",
    },
    {
      id: "AlignmentD2Left",
      shortName: "AD2L",
      shouldShow: false,
      limitName: "HorizontalAlignment",
      limitType: "D2Limits",
      columnName: "Alignment Left",
    },
    {
      id: "AlignmentD1Right",
      shortName: "AD1R",
      shouldShow: false,
      limitName: "HorizontalAlignment",
      limitType: "D1Limits",
      columnName: "Alignment Left",
    },
    {
      id: "AlignmentD1Left",
      shortName: "AD1L",
      shouldShow: false,
      limitName: "HorizontalAlignment",
      limitType: "D1Limits",
      columnName: "Alignment Right",
    },
    {
      id: "TwistBase1",
      shortName: "Twist",
      shouldShow: true,
      limitName: "Twist",
      limitType: "",
      columnName: `Twist ${TwistBaseLength}m`,
    },
    {
      id: "CantDefect",
      shortName: "CantDefect",
      shouldShow: true,
      limitName: "Cant",
      limitType: "",
      columnName: "Cant Defect",
    },
    {
      id: "Cant",
      shortName: "Cant",
      shouldShow: false,
      limitName: "Cant",
      limitType: "",
      columnName: "Cant",
    },
    {
      id: "GaugeDefect",
      shortName: "Gauge",
      shouldShow: true,
      limitName: "Gauge",
      limitType: "",
      columnName: "Gauge Defect",
    },
    {
      id: "Localizations",
      shortName: "Localizations",
      shouldShow: true,
      columnName: "Localization Information",
    },
  ];

  const updateShouldShowChart = (charts) => {
    charts.forEach((chart) => {
      chartTypes.find(
        (chartType) => chartType.shortName === chart
      ).shouldShow = true;
    });
  };

  const updateChartTypes = (alignmentType) => {
    switch (chartThresholds[alignmentType].DefectEvaluationType) {
      case "D1":
        alignmentType === "HorizontalAlignment"
          ? updateShouldShowChart(["AD1L", "AD1R"])
          : updateShouldShowChart(["LLD1L", "LLD1R"]);
        return;
      case "D2":
        alignmentType === "HorizontalAlignment"
          ? updateShouldShowChart(["AD2L", "AD2R"])
          : updateShouldShowChart(["LLD2L", "LLD2R"]);
        return;
      case "Versines":
        alignmentType === "HorizontalAlignment"
          ? updateShouldShowChart(["VHL", "VHR"])
          : updateShouldShowChart(["VVL", "VVR"]);
        return;
    }
  };

  const addAreaCharDataPoint = (
    value,
    areaChartData,
    color,
    severityFlag = ""
  ) => {
    if (
      !areaChartData.length ||
      areaChartData[areaChartData.length - 1].severityFlag !== severityFlag
    ) {
      areaChartData.push({
        axisXType: "secondary",
        severityFlag,
        type: "area",
        markerSize: 0,
        axisXType: "secondary",
        dataPoints: [value],
        color,
        lineColor: "black",
      });
    } else {
      areaChartData[areaChartData.length - 1].dataPoints?.push(value);
    }
  };

  const dataPointGenerator = (values, limits, key = "") => {
    if (!limits.length) {
      return [values, [], null, null];
    }
    const lineChartDataPoints = [];
    const areaChartData = [];
    let currentThresholdIndex = 0;
    let minY = Math.min(
      values?.[0]?.y || Infinity,
      limits[0].LimitsBySeverity[2].Lower
    );
    maxY = Math.max(
      values?.[0]?.y || -Infinity,
      limits[0].LimitsBySeverity[2].Upper
    );
    values?.forEach((value) => {
      if (
        (value.x == null && Number.isNaN(value.x)) ||
        (value.y == null && Number.isNaN(value.y))
      ) {
        return;
      }
      let currentChartThreshold = limits[currentThresholdIndex];
      if (value.x > currentChartThreshold.StationingEnd) {
        if (currentThresholdIndex + 1 < limits.length) {
          currentThresholdIndex += 1;
          currentChartThreshold = limits[currentThresholdIndex];
          minY = Math.min(
            minY,
            currentChartThreshold.LimitsBySeverity[2].Lower
          );
          maxY = Math.max(
            maxY,
            currentChartThreshold.LimitsBySeverity[2].Upper
          );
        } else {
          lineChartDataPoints.push({ ...value });
          addAreaCharDataPoint(value, areaChartData, "transparent");
          if (minY > value.y) {
            minY = value.y;
          }
          if (maxY < value.y) {
            maxY = value.y;
          }
          return;
        }
      }
      if (value.y > currentChartThreshold.LimitsBySeverity[2].Upper) {
        lineChartDataPoints.push({ ...value });
        addAreaCharDataPoint(value, areaChartData, "#E40D3B", "IAL");
      } else if (
        value.y > currentChartThreshold.LimitsBySeverity[1].Upper &&
        value.y < currentChartThreshold.LimitsBySeverity[2].Upper
      ) {
        lineChartDataPoints.push({ ...value });
        addAreaCharDataPoint(value, areaChartData, "#FF9B31", "IL");
      } else if (
        value.y > currentChartThreshold.LimitsBySeverity[0].Upper &&
        value.y < currentChartThreshold.LimitsBySeverity[1].Upper
      ) {
        lineChartDataPoints.push({ ...value });
        addAreaCharDataPoint(value, areaChartData, "#FFEF35", "AL");
      } else if (
        value.y < currentChartThreshold.LimitsBySeverity[0].Upper &&
        value.y > currentChartThreshold.LimitsBySeverity[0].Lower
      ) {
        lineChartDataPoints.push({ ...value });
        addAreaCharDataPoint(value, areaChartData, "transparent");
      } else if (
        value.y < currentChartThreshold.LimitsBySeverity[0].Lower &&
        value.y > currentChartThreshold.LimitsBySeverity[1].Lower
      ) {
        lineChartDataPoints.push({ ...value });
        addAreaCharDataPoint(value, areaChartData, "#FFEF35", "AL");
      } else if (
        value.y < currentChartThreshold.LimitsBySeverity[1].Lower &&
        value.y > currentChartThreshold.LimitsBySeverity[2].Lower
      ) {
        lineChartDataPoints.push({ ...value });
        addAreaCharDataPoint(value, areaChartData, "#FF9B31", "IL");
      } else if (value.y < currentChartThreshold.LimitsBySeverity[2].Lower) {
        lineChartDataPoints.push({ ...value });
        addAreaCharDataPoint(value, areaChartData, "#E40D3B", "IAL");
      } else {
        lineChartDataPoints.push({ ...value });
        addAreaCharDataPoint(value, areaChartData, "transparent");
      }
      if (minY > value.y) {
        minY = value.y;
      }
      if (maxY < value.y) {
        maxY = value.y;
      }
    });
    return [lineChartDataPoints, areaChartData, minY, maxY];
  };

  const getLineColor = (index) => {
    switch (index) {
      case 0:
        return "#FFEF35";
      case 1:
        return "#FF9B31";
      case 2:
        return "#E40D3B";
      default:
        return "#FFEF35";
    }
  };

  const configureThresholdLimits = (currentChartType) => {
    if (currentChartType.id === "Localizations") return [];
    let limits = [];
    if (!currentChartType?.limitType) {
      limits = chartThresholds[currentChartType.limitName].Limits;
    } else {
      limits =
        chartThresholds[currentChartType.limitName][currentChartType.limitType];
    }
    return limits;
  };

  const generateThresholdStriplines = (limits) => {
    const thresholdDataSet = [];
    const addToThresholdData = (start, end, yCoordinate, lineColor) => {
      const commonProps = {
        y: yCoordinate,
        lineColor,
      };
      thresholdDataSet.push({
        type: "line",
        axisXType: "secondary",
        markerSize: 0,
        lineDashType: "dash",
        lineThickness: 1,
        dataPoints: [
          {
            x: start,
            ...commonProps,
          },
          {
            x: end,
            ...commonProps,
          },
        ],
      });
    };
    for (const limit of limits) {
      if (limit.StationingStart > StationingEnd) break;
      if (
        limit.StationingStart <= StationingEnd &&
        limit.StationingEnd > StationingStart
      ) {
        limit.LimitsBySeverity.forEach((element, index) => {
          const lineColor = getLineColor(index);
          addToThresholdData(
            limit.StationingStart,
            limit.StationingEnd,
            element.Lower,
            lineColor
          );
          addToThresholdData(
            limit.StationingStart,
            limit.StationingEnd,
            element.Upper,
            lineColor
          );
        });
      }
    }
    return thresholdDataSet;
  };

  const generateEventStriplines = (chartListLength) => {
    const eventStripLines = [];
    events?.forEach((event) => {
      eventStripLines.push({
        value: event.MeasuredStationingStart,
        labelPlacement: "outside",
        lineDashType: "longDash",
        labelBackgroundColor: "#fff",
        color: "#000",
        label:
          chartListLength === 7
            ? `${event.MappedStationingStart}, ${event.Abbr.toUpperCase()}${
                event.IsRange ? "\u25BC" : ""
              }`
            : "",
        showOnTop: true,
        labelFontColor: "#000",
        labelFontFamily: "Roboto",
        labelWrap: true,
        labelAlign: "near",
        labelAngle: 270,
        labelFontSize: 14,
        labelMaxWidth: 130,
      });
      if (event.IsRange) {
        eventStripLines.push({
          value: event.MeasuredStationingEnd,
          labelPlacement: "outside",
          lineDashType: "longDash",
          color: "#000",
          labelBackgroundColor: "#fff",
          label:
            chartListLength === 7
              ? `${event.MappedStationingEnd.toString()}, ${event.Abbr.toLowerCase()}\u25B2`
              : "",
          showOnTop: true,
          labelFontColor: "#000",
          labelFontFamily: "Roboto",
          labelWrap: true,
          labelAlign: "near",
          labelAngle: 270,
          labelFontSize: 14,
          labelMaxWidth: 130,
        });
      }
    });
    return eventStripLines;
  };

  const generateSpeedZoneStriplines = (speedZones, chartListLength) => {
    return speedZones.map((limit) => ({
      value: limit.value,
      labelPlacement: "outside",
      lineDashType: "longDashDot",
      color: "#000",
      label:
        chartListLength === 7
          ? `${limit.MinSpeed.toFixed(1)}<V<=${limit.MaxSpeed.toFixed(
              1
            )} \u25BC`
          : "",
      showOnTop: true,
      labelBackgroundColor: "#fff",
      labelFontColor: "#5a5a5a",
      labelFontFamily: "Roboto",
      labelWrap: false,
      labelAlign: "near",
      labelAngle: 270,
      labelFontSize: 14,
      labelMaxWidth: 130,
      labelWrap: true,
    }));
  };

  const generateChartELement = (index, columnName) => {
    const row = document.createElement("div");
    row.classList.add("row");
    document.querySelector(`.${chartContainerClass}`).append(row);
    const chartColumnName = document.createElement("div");
    chartColumnName.classList.add("chartColumnName");
    const paragraph = document.createElement("p");
    chartColumnName.append(paragraph);
    row.append(chartColumnName);
    const chart = document.createElement("div");
    chart.classList.add("chart");
    chart.classList.add(`chart-${index + 1}`);
    chart.setAttribute("id", `chart-${index + 1}${StationingStart.toFixed(0)}`);
    row.append(chart);
  };

  const addLabels = (index, columnName) => {
    if (index === 7) {
      document.querySelector(
        `.${chartContainerClass} .row:nth-of-type(${index + 1}) p`
      ).innerHTML = `Localization Information [m]`;
      return;
    }
    if (columnName === "Cant Defect") {
      document.querySelector(
        `.${chartContainerClass} .row:nth-of-type(${index + 1}) p`
      ).innerHTML = `Cant Defect 1:${DefectScale.toFixed(
        0
      )} [mm] <br> Cant 1:${SignalScale.toFixed(0)} [mm]`;
      return;
    }
    document.querySelector(
      `.${chartContainerClass} .row:nth-of-type(${index + 1}) p`
    ).innerHTML = `${columnName} <br> 1:${DefectScale.toFixed(0)} [mm]`;
  };

  const generateYAxisLabels = (limits) => {
    let labels = [];
    limits?.[0]?.LimitsBySeverity.forEach((limit) => {
      labels = [...labels, limit.Upper, limit.Lower];
    });
    return [...labels, 0];
  };

  const newChartData = {};

  updateChartTypes("HorizontalAlignment");
  updateChartTypes("VerticalAlignment");

  let chartData = [];
  if (VisualTrackDatas?.length) {
    VisualTrackDatas.forEach((row) => {
      row.ParameterValues.forEach((cell) => {
        if (!newChartData[cell.Id]) newChartData[cell.Id] = [];
        newChartData[cell.Id].push({
          x: row.Stationing.Value,
          y: cell.Id !== "Cant" ? cell.Value : cell.Value / SignalScale,
        });
      });
    });
    chartData = chartTypes.reduce(
      (prev, current) => ({
        ...prev,
        [current.id]: newChartData[current.id],
      }),
      {}
    );
    const withLocalization = { ...chartData, Localizations: [] };
    chartData = withLocalization;
  } else {
    chartData = {
      VersineVerticalRight: [],
      VersineVerticalLeft: [],
      VersineHorizontalRight: [],
      VersineHorizontalLeft: [],
      LongitudinalLevelD2Right: [],
      LongitudinalLevelD2Left: [],
      LongitudinalLevelD1Right: [],
      LongitudinalLevelD1Left: [],
      AlignmentD2Right: [],
      AlignmentD2Left: [],
      AlignmentD1Right: [],
      AlignmentD1Left: [],
      TwistBase1: [],
      CantDefect: [],
      Cant: [],
      GaugeDefect: [],
      Localizations: [],
    };
  }
  if (chartData) {
    let index = 0;
    const chartList = [];
    const speedZones = chartThresholds.Gauge.Limits.map((limit) => ({
      value: limit.StationingEnd,
      MinSpeed: limit.MinSpeed,
      MaxSpeed: limit.MaxSpeed,
    }));
    for (const [key, value] of Object.entries(chartData)) {
      const param = chartTypes.find((paramItem) => paramItem.id === key);
      if (param && param.shouldShow) {
        const limits = configureThresholdLimits(param);
        const yAxisLabels =
          param.id === "Localizations" ? [] : generateYAxisLabels(limits);
        const [lineChartDataPoints, areaChartData, minY, maxY] =
          dataPointGenerator(value, limits);
        let thresholdDataSet = [];
        thresholdDataSet = generateThresholdStriplines(limits);
        const eventStripLines = DisplayEvents
          ? generateEventStriplines(chartList.length)
          : [];
        const speedZoneStripLines = generateSpeedZoneStriplines(
          speedZones,
          chartList.length
        );
        let height = (Math.abs(maxY - minY) / DefectScale) * 3.7795275591 + 8;
        if (chartList.length === 7) {
          height = 133; //92 -> 133
        }
        // height = height * 2;
        chartList.push({
          height: height,
          backgroundColor:
            chartList.length % 2 === 0
              ? "rgb(220, 220, 220, 0.5)"
              : "transparent",
          axisX2: {
            minimum: StationingStart - 1 * widthRatio,
            maximum: StationingEnd + 1 * widthRatio,
            lineThickness: 0,
            gridThickness: 0,
            tickLength: 0,
            tickPlacement: "inside",
            labelPlacement: "inside",
            labelAutoFit: true,
            labelWrap: false,
            labelFontWeight: "lighter",
            labelFormatter: () => "",
            crosshair: {
              enabled: true,
              snapToDataPoint: true,
              lineDashType: "solid",
              labelFormatter: () => "",
            },
            interval: 5 * widthRatio,
            stripLines: [...eventStripLines, ...speedZoneStripLines],
          },
          axisY: {
            titleWrap: false,
            lineThickness: 0,
            gridThickness: 0,
            tickLength: 0,
            maximum: maxY + 1,
            minimum: minY - 1,
            labelFormatter: () => "",
            labelAutoFit: true,
            labelFontSize: 14,
            stripLines: yAxisLabels.map((yAxisLabel, index) => ({
              value: yAxisLabel,
              labelAutoFit: true,
              labelPlacement: "outside",
              lineDashType: "solid",
              color:
                yAxisLabel === 0 && index === yAxisLabels.length - 1
                  ? "#000"
                  : "transparent",
              label: yAxisLabel.toString(),
              showOnTop: true,
              labelFontColor: "#000",
              labelFontFamily: "Roboto",
              labelWrap: false,
              labelAlign: "near",
              labelBackgroundColor: "transparent",
              labelFontSize: 14,
              labelMaxWidth: 30,
            })),
          },
          axisX: {
            minimum: StationingStart - 1 * widthRatio,
            maximum: StationingEnd + 1 * widthRatio,
            tickLength: 2,
            labelAutoFit: true,
            labelWrap: false,
            labelFontWeight: "lighter",
            labelFontSize: 13,
            interval: 5 * widthRatio,
            labelFormatter:
              chartList.length === 7
                ? (e) =>
                    Number(e.value) > StationingEnd &&
                    Number(e.value) < StationingStart
                      ? ""
                      : StationingLabels.find(
                          (label) => label.MeasuredStationingPoint === e.value
                        )?.MappedStationingPoint || ""
                : () => "",
            labelAngle: 270,
            stripLines: [...eventStripLines, ...speedZoneStripLines],
          },
          data: [
            {
              type: "line",
              lineDashType: "solid",
              axisXType: chartList.length === 7 ? "primary" : "secondary",
              markerSize: 0,
              dataPoints: lineChartDataPoints,
              lineColor: "black",
            },
            ...areaChartData,
            ...thresholdDataSet,
          ],
        });
        if (param.shortName === "CantDefect") {
          const cantData = dataPointGenerator(chartData.Cant, limits, "Cant");
          chartList[chartList.length - 1].data.push({
            type: "line",
            lineDashType: "dash",
            axisXType: "secondary",
            markerSize: 0,
            dataPoints: cantData[0],
            lineColor: "black",
          });
          const cantDataMax = cantData[3] + 1;
          const cantDataMin = cantData[2] - 1;
          const prevMax = chartList[chartList.length - 1].axisY.maximum;
          const prevMin = chartList[chartList.length - 1].axisY.minimum;
          const newMax = Math.max(prevMax, cantDataMax);
          const newMin = Math.min(prevMin, cantDataMin);
          height = (Math.abs(newMax - newMin) / DefectScale) * 3.7795275591 + 8;
          chartList[chartList.length - 1].axisY.maximum = newMax;
          chartList[chartList.length - 1].axisY.minimum = newMin;
          chartList[chartList.length - 1].height = height;
        }
        const options = {
          animationEnabled: false,
          charts: [chartList[chartList.length - 1]],
          rangeSelector: {
            enabled: false,
          },
          navigator: {
            enabled: false,
          },
        };
        generateChartELement(index, param.columnName);
        addLabels(index, param.columnName);
        document.querySelector(
          `.${chartContainerClass} .chart-${index + 1}`
        ).style.width = `${PageWidth}px`;
        document.querySelector(
          `.${chartContainerClass} .chart-${index + 1}`
        ).style.height = `${height}px`;
        const stockChart = new CanvasJS.StockChart(
          `chart-${index + 1}${StationingStart.toFixed(0)}`,
          options
        );
        stockChart.render();
        stockChart.charts[0].axisY[0].set(
          "margin",
          35 -
            (stockChart.charts[0].axisY[0].bounds.x2 -
              stockChart.charts[0].axisY[0].bounds.x1)
        );
        index++;
      }
    }

    document.querySelector(
      `.${chartContainerClass}`
    ).parentNode.style.width = `${PageWidth + 41}px`;
    // var canvas = await html2canvas(document.querySelector("#defectChartReport"));
    // return canvas.toDataURL();
  }
};
