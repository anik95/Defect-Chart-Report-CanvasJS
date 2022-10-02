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
    LocalizedAttributes,
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
  const { ChartTableAttributes } = LocalizedAttributes;
  const chartTypes = [
    {
      id: "VersineVerticalRight",
      shortName: "VVR",
      shouldShow: false,
      limitName: "VerticalAlignment",
      limitType: "VersineLimits",
      columnName: ChartTableAttributes.VersineVerticalRight,
    },
    {
      id: "VersineVerticalLeft",
      shortName: "VVL",
      shouldShow: false,
      limitName: "VerticalAlignment",
      limitType: "VersineLimits",
      columnName: ChartTableAttributes.VersineVerticalLeft,
    },
    {
      id: "VersineHorizontalRight",
      shortName: "VHR",
      shouldShow: false,
      limitName: "HorizontalAlignment",
      limitType: "VersineLimits",
      columnName: ChartTableAttributes.VersineHorizontalRight,
    },
    {
      id: "VersineHorizontalLeft",
      shortName: "VHL",
      shouldShow: false,
      limitName: "HorizontalAlignment",
      limitType: "VersineLimits",
      columnName: ChartTableAttributes.VersineHorizontalLeft,
    },
    {
      id: "LongitudinalLevelD2Right",
      shortName: "LLD2R",
      shouldShow: false,
      limitName: "VerticalAlignment",
      limitType: "D2Limits",
      columnName: ChartTableAttributes.LongitudinalLevelRight,
    },
    {
      id: "LongitudinalLevelD2Left",
      shortName: "LLD2L",
      shouldShow: false,
      limitName: "VerticalAlignment",
      limitType: "D2Limits",
      columnName: ChartTableAttributes.LongitudinalLevelLeft,
    },
    {
      id: "LongitudinalLevelD1Right",
      shortName: "LLD1R",
      shouldShow: false,
      limitName: "VerticalAlignment",
      limitType: "D1Limits",
      columnName: ChartTableAttributes.LongitudinalLevelRight,
    },
    {
      id: "LongitudinalLevelD1Left",
      shortName: "LLD1L",
      shouldShow: false,
      limitName: "VerticalAlignment",
      limitType: "D1Limits",
      columnName: ChartTableAttributes.LongitudinalLevelLeft,
    },
    {
      id: "AlignmentD2Right",
      shortName: "AD2R",
      shouldShow: false,
      limitName: "HorizontalAlignment",
      limitType: "D2Limits",
      columnName: ChartTableAttributes.AlignmentRight,
    },
    {
      id: "AlignmentD2Left",
      shortName: "AD2L",
      shouldShow: false,
      limitName: "HorizontalAlignment",
      limitType: "D2Limits",
      columnName: ChartTableAttributes.AlignmentLeft,
    },
    {
      id: "AlignmentD1Right",
      shortName: "AD1R",
      shouldShow: false,
      limitName: "HorizontalAlignment",
      limitType: "D1Limits",
      columnName: ChartTableAttributes.AlignmentRight,
    },
    {
      id: "AlignmentD1Left",
      shortName: "AD1L",
      shouldShow: false,
      limitName: "HorizontalAlignment",
      limitType: "D1Limits",
      columnName: ChartTableAttributes.AlignmentLeft,
    },
    {
      id: "TwistBase1",
      shortName: "Twist",
      shouldShow: true,
      limitName: "Twist",
      limitType: "",
      columnName: `${ChartTableAttributes.Twist} ${TwistBaseLength}m`,
    },
    {
      id: "CantDefect",
      shortName: "CantDefect",
      shouldShow: true,
      limitName: "Cant",
      limitType: "",
      columnName: ChartTableAttributes.CantDefect,
    },
    {
      id: "Cant",
      shortName: "Cant",
      shouldShow: false,
      limitName: "Cant",
      limitType: "",
      columnName: ChartTableAttributes.Cant,
    },
    {
      id: "GaugeDefect",
      shortName: "Gauge",
      shouldShow: true,
      limitName: "Gauge",
      limitType: "",
      columnName: ChartTableAttributes.GaugeDefect,
    },
    {
      id: "Localizations",
      shortName: "Localizations",
      shouldShow: true,
      columnName: ChartTableAttributes.LocalizationInformation,
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
        lineColor: "transparent",
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
        lineThickness: 0.8,
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
        labelBackgroundColor: "transparent",
        color: "#000",
        label:
          chartListLength === 7
            ? `${event.MappedStationingStart.toFixed(
                2
              )}, ${event.Abbr.toUpperCase()}${event.IsRange ? "\u25BC" : ""}`
            : "",
        showOnTop: true,
        labelFontColor: "#000",
        labelFontFamily: "Calibri",
        labelWrap: true,
        labelAlign: "near",
        labelAngle: 270,
        labelFontSize: 11,
        labelMaxWidth: 130,
      });
      if (event.IsRange) {
        eventStripLines.push({
          value: event.MeasuredStationingEnd,
          labelPlacement: "outside",
          lineDashType: "longDash",
          color: "#000",
          labelBackgroundColor: "transparent",
          label:
            chartListLength === 7
              ? `${event.MappedStationingEnd.toFixed(
                  2
                )}, ${event.Abbr.toLowerCase()}\u25B2`
              : "",
          showOnTop: true,
          labelFontColor: "#000",
          labelFontFamily: "Calibri",
          labelWrap: true,
          labelAlign: "near",
          labelAngle: 270,
          labelFontSize: 11,
          labelMaxWidth: 130,
        });
      }
    });
    return eventStripLines;
  };

  const generateSpeedZoneStripLines = (speedZones, chartListLength) => {
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
      labelBackgroundColor: "transparent",
      labelFontColor: "#5a5a5a",
      labelFontFamily: "Calibri",
      labelWrap: false,
      labelAlign: "near",
      labelAngle: 270,
      labelFontSize: 11,
      labelMaxWidth: 130,
      labelWrap: true,
    }));
  };

  const generateLabelStripLines = (chartListLength) => {
    return StationingLabels.map((label) => ({
      value: label.MeasuredStationingPoint,
      labelPlacement: "outside",
      lineDashType: "solid",
      color: "transparent",
      label: chartListLength === 7 ? `${label.MappedStationingPoint}` : "",
      showOnTop: true,
      labelBackgroundColor: "transparent",
      labelFontColor: "#000",
      labelFontFamily: "Calibri",
      labelWrap: false,
      labelAlign: "near",
      labelAngle: 270,
      labelMaxWidth: 130,
      labelWrap: true,
      labelAutoFit: true,
      labelFontWeight: "lighter",
      labelFontSize: 10,
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
      ).innerHTML = `${ChartTableAttributes.LocalizationInformation} [m]`;
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
      value: limit.StationingStart,
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
        const amplitudeToPixelAdjustment = 11;
        const amplitude =
          (Math.abs(maxY) / DefectScale) * 3.78 + amplitudeToPixelAdjustment;
        let thresholdDataSet = [];
        thresholdDataSet = generateThresholdStriplines(limits);
        const eventStripLines = DisplayEvents
          ? generateEventStriplines(chartList.length)
          : [];
        const speedZoneStripLines = generateSpeedZoneStripLines(
          speedZones,
          chartList.length
        );
        const labelStripLines = generateLabelStripLines(chartList.length);
        let height = (Math.abs(maxY - minY) / DefectScale) * 3.78 + 13;
        if (height < 10 || height === Infinity) {
          height = 10;
        }
        if (chartList.length === 7) {
          height = 133;
        }
        chartList.push({
          height: height,
          backgroundColor:
            chartList.length % 2 === 0 ? "#efefef" : "transparent",
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
            labelFontSize: 11,
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
              labelFontFamily: "Calibri",
              labelWrap: false,
              labelAlign: "near",
              labelBackgroundColor: "transparent",
              labelFontSize: 11,
              labelMaxWidth: 30,
            })),
          },
          axisX: {
            minimum: StationingStart - 1 * widthRatio,
            maximum: StationingEnd + 1 * widthRatio,
            tickLength: 0,
            labelAutoFit: true,
            labelWrap: false,
            labelFontWeight: "lighter",
            labelFontSize: 10,
            labelFormatter: () => "",
            labelAngle: 270,
            stripLines: [
              ...eventStripLines,
              ...speedZoneStripLines,
              ...labelStripLines,
            ],
          },
          data: [
            {
              type: "line",
              lineDashType: "solid",
              axisXType: chartList.length === 7 ? "primary" : "secondary",
              markerSize: 0,
              dataPoints: lineChartDataPoints,
              lineColor: "black",
              lineThickness: 0.8,
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
            lineThickness: 0.8,
          });
          const cantDataMax = cantData[3] + 1;
          const cantDataMin = cantData[2] - 1;
          const prevMax = chartList[chartList.length - 1].axisY.maximum;
          const prevMin = chartList[chartList.length - 1].axisY.minimum;
          const newMax = Math.max(prevMax, cantDataMax);
          const newMin = Math.min(prevMin, cantDataMin);
          height = (Math.abs(newMax - newMin) / DefectScale) * 3.78 + 13;
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
        ).style.width = `${PageWidth - 1}px`;
        document.querySelector(
          `.${chartContainerClass} .chart-${index + 1}`
        ).style.height = `${height}px`;
        const stockChart = new CanvasJS.StockChart(
          `chart-${index + 1}${StationingStart.toFixed(0)}`,
          options
        );
        if (index < 7) {
          const sign = height > 131 ? "-" : "+";
          document.querySelector(
            `.${chartContainerClass} .chart-${index + 1}`
          ).style.transform = `translate(0, ${sign}${Math.abs(
            65.5 - amplitude
          )}px)`;
        }
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

    document.querySelector(`.${chartContainerClass}`).style.width = `${
      PageWidth + 38
    }px`;
    document.querySelector(
      `.${chartContainerClass}`
    ).parentNode.style.maxHeight = `${PageWidth + 38 + 4}px`;
  }
};
