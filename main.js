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
  const mmToPixel = 3.78;
  const minDistanceForOverlapForLines = 20;
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
      columnName: ChartTableAttributes.LongitudinalLevelRight,
    },
    {
      id: "VersineVerticalLeft",
      shortName: "VVL",
      shouldShow: false,
      limitName: "VerticalAlignment",
      limitType: "VersineLimits",
      columnName: ChartTableAttributes.LongitudinalLevelLeft,
    },
    {
      id: "VersineHorizontalRight",
      shortName: "VHR",
      shouldShow: false,
      limitName: "HorizontalAlignment",
      limitType: "VersineLimits",
      columnName: ChartTableAttributes.AlignmentRight,
    },
    {
      id: "VersineHorizontalLeft",
      shortName: "VHL",
      shouldShow: false,
      limitName: "HorizontalAlignment",
      limitType: "VersineLimits",
      columnName: ChartTableAttributes.AlignmentLeft,
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
      const yValues = values.map((value) => value.y);
      return [values, [], Math.min(...yValues), Math.max(...yValues)];
    }
    const lineChartDataPoints = [];
    const areaChartData = [];
    let currentThresholdIndex = 0;
    let minY = Math.min(
      values?.[0]?.y || Infinity,
      limits[0]?.LimitsBySeverity?.[2]?.Lower || Infinity
    );
    maxY = Math.max(
      values?.[0]?.y || -Infinity,
      limits[0]?.LimitsBySeverity?.[2]?.Upper || -Infinity
    );
    values?.forEach((value) => {
      if (
        (value.x == null && Number.isNaN(value.x)) ||
        (value.y == null && Number.isNaN(value.y))
      ) {
        return;
      }
      let currentChartThreshold = limits[currentThresholdIndex];
      if (value.x > currentChartThreshold?.StationingEnd) {
        if (currentThresholdIndex + 1 < limits.length) {
          currentThresholdIndex += 1;
          currentChartThreshold = limits[currentThresholdIndex];
          minY = Math.min(
            minY,
            currentChartThreshold?.LimitsBySeverity?.[2]?.Lower || minY
          );
          maxY = Math.max(
            maxY,
            currentChartThreshold?.LimitsBySeverity?.[2]?.Upper || maxY
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
      if (value.y > currentChartThreshold?.LimitsBySeverity?.[2]?.Upper) {
        lineChartDataPoints.push({ ...value });
        addAreaCharDataPoint(value, areaChartData, "#E40D3B", "IAL");
      } else if (
        value.y > currentChartThreshold?.LimitsBySeverity?.[1]?.Upper &&
        value.y < currentChartThreshold?.LimitsBySeverity?.[2]?.Upper
      ) {
        lineChartDataPoints.push({ ...value });
        addAreaCharDataPoint(value, areaChartData, "#FF9B31", "IL");
      } else if (
        value.y > currentChartThreshold?.LimitsBySeverity?.[0]?.Upper &&
        value.y < currentChartThreshold?.LimitsBySeverity?.[1]?.Upper
      ) {
        lineChartDataPoints.push({ ...value });
        addAreaCharDataPoint(value, areaChartData, "#FFEF35", "AL");
      } else if (
        value.y < currentChartThreshold?.LimitsBySeverity?.[0]?.Upper &&
        value.y > currentChartThreshold?.LimitsBySeverity?.[0]?.Lower
      ) {
        lineChartDataPoints.push({ ...value });
        addAreaCharDataPoint(value, areaChartData, "transparent");
      } else if (
        value.y < currentChartThreshold?.LimitsBySeverity?.[0]?.Lower &&
        value.y > currentChartThreshold?.LimitsBySeverity?.[1]?.Lower
      ) {
        lineChartDataPoints.push({ ...value });
        addAreaCharDataPoint(value, areaChartData, "#FFEF35", "AL");
      } else if (
        value.y < currentChartThreshold?.LimitsBySeverity?.[1]?.Lower &&
        value.y > currentChartThreshold?.LimitsBySeverity?.[2]?.Lower
      ) {
        lineChartDataPoints.push({ ...value });
        addAreaCharDataPoint(value, areaChartData, "#FF9B31", "IL");
      } else if (
        value.y < currentChartThreshold?.LimitsBySeverity?.[2]?.Lower
      ) {
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

  const generateEventStriplines = (speedZones) => {
    const speedZoneLocalizations = speedZones.map(
      (speedZone) => speedZone.value
    );
    const eventStripLines = [];
    const checkEventSpeedZoneOverlap = (currentEventVal) => {
      let overlaps = false;
      speedZoneLocalizations.forEach((speedZone) => {
        if (
          getXAxisDistanceInPixel(Math.abs(currentEventVal - speedZone)) <
          minDistanceForOverlapForLines
        ) {
          overlaps = true;
        }
      });
      return overlaps;
    };
    events?.forEach((event) => {
      if (!checkEventSpeedZoneOverlap(event.MeasuredStationingStart)) {
        eventStripLines.push({
          value: event.MeasuredStationingStart,
          labelPlacement: "outside",
          lineDashType: "longDash",
          labelBackgroundColor: "transparent",
          color: "#000",
          label: `${event.MappedStationingStart.toFixed(
            2
          )}, ${event.Abbr.toUpperCase()}${event.IsRange ? "\u25BC" : ""}`,
          showOnTop: true,
          labelFontColor: "#000",
          labelFontFamily: "Calibri",
          labelWrap: true,
          labelAlign: "near",
          labelAngle: 270,
          labelFontSize: 11,
          labelMaxWidth: 90,
        });
      }
      if (
        event.IsRange &&
        !checkEventSpeedZoneOverlap(event.MeasuredStationingEnd)
      ) {
        eventStripLines.push({
          value: event.MeasuredStationingEnd,
          labelPlacement: "outside",
          lineDashType: "longDash",
          color: "#000",
          labelBackgroundColor: "transparent",
          label: `${event.MappedStationingEnd.toFixed(
            2
          )}, ${event.Abbr.toLowerCase()}\u25B2`,
          showOnTop: true,
          labelFontColor: "#000",
          labelFontFamily: "Calibri",
          labelWrap: true,
          labelAlign: "near",
          labelAngle: 270,
          labelFontSize: 11,
          labelMaxWidth: 90,
        });
      }
    });
    return eventStripLines;
  };

  const generateSpeedZoneStripLines = (speedZones) => {
    return speedZones.map((limit) => ({
      value: limit.value,
      labelPlacement: "outside",
      lineDashType: "longDashDot",
      color: "#000",
      label: `${limit.MinSpeed.toFixed(0)}<V<=${limit.MaxSpeed.toFixed(
        0
      )} \u25BC`,
      showOnTop: true,
      labelBackgroundColor: "transparent",
      labelFontColor: "#5a5a5a",
      labelFontFamily: "Calibri",
      labelWrap: false,
      labelAlign: "near",
      labelAngle: 270,
      labelFontSize: 11,
      labelMaxWidth: 90,
      labelWrap: true,
    }));
  };

  const getXAxisDistanceInPixel = (diff) => {
    return ((Math.abs(diff) * 1000) / LocalizationScale) * mmToPixel;
  };

  const generateLabelStripLines = (chartListLength, speedZones) => {
    const eventLocalizations = [];
    const speedZoneLocalizations = speedZones.map(
      (speedZone) => speedZone.value
    );
    let filteredStationingLabels = [...StationingLabels];
    if (DisplayEvents) {
      events.forEach((event) => {
        eventLocalizations.push(event.MeasuredStationingStart);
        if (event.IsRange) {
          eventLocalizations.push(event.MeasuredStationingEnd);
        }
      });
    }
    filteredStationingLabels = StationingLabels.filter((label) => {
      let overlapsWithEvent = false;
      let overlapsWithSpeedZone = false;
      eventLocalizations.forEach((event) => {
        if (
          getXAxisDistanceInPixel(
            Math.abs(event - label.MeasuredStationingPoint)
          ) < minDistanceForOverlapForLines
        ) {
          overlapsWithEvent = true;
        }
      });
      speedZoneLocalizations.forEach((speedZone) => {
        if (
          getXAxisDistanceInPixel(
            Math.abs(speedZone - label.MeasuredStationingPoint)
          ) < minDistanceForOverlapForLines
        ) {
          overlapsWithSpeedZone = true;
        }
      });
      return !(overlapsWithEvent || overlapsWithSpeedZone);
    });

    return filteredStationingLabels.map((label) => ({
      value: label.MeasuredStationingPoint,
      labelPlacement: "outside",
      lineDashType: "dot",
      color: "#000",
      label: chartListLength === 7 ? `${label.MappedStationingPoint}` : "",
      showOnTop: true,
      labelBackgroundColor: "transparent",
      labelFontColor: "#000",
      labelFontFamily: "Calibri",
      labelWrap: false,
      labelAlign: "near",
      labelAngle: 270,
      labelMaxWidth: 90,
      labelWrap: true,
      labelAutoFit: true,
      labelFontWeight: "lighter",
      labelFontSize: 10,
    }));
  };

  const generateChartElement = (index, columnName) => {
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

  const distanceBetweenYAxisPointsInPixels = (
    higherPriorityLimit,
    lowerPriorityLimit
  ) => {
    return (
      (Math.abs(higherPriorityLimit - lowerPriorityLimit) / DefectScale) *
      mmToPixel
    );
  };

  const generateYAxisLabels = (limits) => {
    const upper = [];
    const lower = [];
    const pixelAdjustment = 13;
    limits?.[0]?.LimitsBySeverity.forEach((limit) => {
      upper.push(limit.Upper);
      lower.push(limit.Lower);
    });
    const indicesToRemoveFromUpper = [];
    const indicesToRemoveFromLower = [];
    const minOverlapLengthInPixels = 18;
    for (let i = 1; i < upper.length; i++) {
      let upperHeight = distanceBetweenYAxisPointsInPixels(
        upper[i],
        upper[i - 1]
      );
      if (upperHeight < minOverlapLengthInPixels) {
        indicesToRemoveFromUpper.push(i - 1);
      }
      let lowerHeight = distanceBetweenYAxisPointsInPixels(
        lower[i],
        lower[i - 1]
      );
      if (lowerHeight < minOverlapLengthInPixels) {
        indicesToRemoveFromLower.push(i - 1);
      }
    }
    const upperLabels = upper.filter(
      (_, index) => !indicesToRemoveFromUpper.includes(index)
    );
    const lowerLabels = lower.filter(
      (_, index) => !indicesToRemoveFromLower.includes(index)
    );
    const shouldShowLabelForZero = () => {
      let shouldShow = true;
      const closestLowerLabelToZero = lowerLabels[0];
      const closestUpperLabelToZero = upperLabels[0];
      if (
        distanceBetweenYAxisPointsInPixels(closestLowerLabelToZero, 0) <
          minOverlapLengthInPixels ||
        distanceBetweenYAxisPointsInPixels(closestUpperLabelToZero, 0) <
          minOverlapLengthInPixels
      ) {
        shouldShow = false;
      }
      return shouldShow;
    };
    const allLabels = [...lowerLabels, ...upperLabels];
    if (shouldShowLabelForZero()) {
      allLabels.push(0);
    }
    if (
      allLabels.length === 2 &&
      !allLabels.includes(0) &&
      distanceBetweenYAxisPointsInPixels(allLabels[1], allLabels[0]) <
        minOverlapLengthInPixels
    ) {
      allLabels.splice(0, 1);
    }
    return allLabels;
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
  const generateContinuousRow = (numRow, className) => {
    generateChartElement(numRow, "");
    const row = document.querySelector(".row:last-of-type");
    row.classList.add("row-continuous");
    row.classList.add(className);
    document.querySelector(
      `.${chartContainerClass} .chart-${numRow + 1}`
    ).style.width = `${PageWidth - 1}px`;
    document.querySelector(
      `.${chartContainerClass} .chart-${numRow + 1}`
    ).style.height = `1072px`;
  };

  const generateContinuousLines = (
    index,
    labelStripLines,
    localizations,
    speedZones
  ) => {
    const eventIndex = index;
    const speedZoneIndex = index + 1;
    generateContinuousRow(eventIndex, "event");
    generateContinuousRow(speedZoneIndex, "speed-zone");
    let eventStripLines = DisplayEvents
      ? generateEventStriplines(speedZones)
      : [];
    let speedZoneStripLines = generateSpeedZoneStripLines(speedZones);
    const continuousChartData = {
      height: 1072,
      backgroundColor: "transparent",
      axisX2: {
        minimum: StationingStart - 0.2 * widthRatio,
        maximum: StationingEnd + 0.2 * widthRatio,
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
      },
      axisY: {
        titleWrap: false,
        lineThickness: 0,
        gridThickness: 0,
        tickLength: 0,
        labelFormatter: () => "",
        labelAutoFit: true,
        labelFontSize: 11,
      },
      axisX: {
        minimum: StationingStart - 0.2 * widthRatio,
        maximum: StationingEnd + 0.2 * widthRatio,
        tickLength: 0,
        labelAutoFit: true,
        labelWrap: false,
        labelFontWeight: "lighter",
        labelFontSize: 10,
        labelFormatter: () => "",
        labelAngle: 270,
        tickPlacement: "inside",
        labelPlacement: "inside",
        gridThickness: 0,
        lineThickness: 0,
      },
      data: [
        {
          type: "line",
          lineDashType: "solid",
          axisXType: "primary",
          markerSize: 0,
          dataPoints: localizations,
          lineColor: "transparent",
          lineThickness: 0.8,
        },
      ],
    };
    const continuousChartWithSpeedZones = {
      ...continuousChartData,
      axisX: {
        ...continuousChartData.axisX,
        stripLines: [
          ...speedZoneStripLines,
          ...labelStripLines.map((labelStripLine) => ({
            ...labelStripLine,
            labelFormatter: () => "",
          })),
        ],
      },
    };
    const continuousChartWithEvents = {
      ...continuousChartData,
      axisX: {
        ...continuousChartData.axisX,
        stripLines: [...eventStripLines],
      },
    };
    const commonOptions = {
      backgroundColor: "transparent",
      animationEnabled: false,

      rangeSelector: {
        enabled: false,
      },
      navigator: {
        enabled: false,
      },
    };
    const continuousChartOptionsWithEvents = {
      ...commonOptions,
      charts: [continuousChartWithEvents],
    };
    const continuousChartOptionsWithSpeedZones = {
      ...commonOptions,
      charts: [continuousChartWithSpeedZones],
    };
    //render events chart
    const continuousEventsStockChart = new CanvasJS.StockChart(
      `chart-${eventIndex + 1}${StationingStart.toFixed(0)}`,
      continuousChartOptionsWithEvents
    );
    continuousEventsStockChart.render();
    continuousEventsStockChart.charts[0].axisY[0].set(
      "margin",
      35 -
        (continuousEventsStockChart.charts[0].axisY[0].bounds.x2 -
          continuousEventsStockChart.charts[0].axisY[0].bounds.x1)
    );
    //render speedzone chart
    const continuousSpeedZoneStockChart = new CanvasJS.StockChart(
      `chart-${speedZoneIndex + 1}${StationingStart.toFixed(0)}`,
      continuousChartOptionsWithSpeedZones
    );
    continuousSpeedZoneStockChart.render();
  };
  if (chartData) {
    let index = 0;
    const chartList = [];
    const speedZones = chartThresholds.Gauge.Limits.map((limit) => ({
      value: limit.StationingStart,
      MinSpeed: limit.MinSpeed,
      MaxSpeed: limit.MaxSpeed,
    }));
    let labelStripLines = [];
    let continuousLocalizationPoints = [];
    for (const [key, value] of Object.entries(chartData)) {
      const param = chartTypes.find((paramItem) => paramItem.id === key);
      if (param && param.shouldShow) {
        const limits = configureThresholdLimits(param);
        const yAxisLabels =
          param.id === "Localizations" ? [] : generateYAxisLabels(limits);
        const showReferenceLineLabel = yAxisLabels.includes(0);
        if (!showReferenceLineLabel) {
          yAxisLabels.push(0);
        }
        const [lineChartDataPoints, areaChartData, minY, maxY] =
          dataPointGenerator(value, limits);
        if (!continuousLocalizationPoints.length) {
          continuousLocalizationPoints = lineChartDataPoints.map((point) => ({
            x: point.x,
            y: 0,
          }));
        }
        const amplitudeToPixelAdjustment = 11;
        const amplitude =
          (Math.abs(maxY) / DefectScale) * mmToPixel +
          amplitudeToPixelAdjustment;
        let thresholdDataSet = [];
        thresholdDataSet = generateThresholdStriplines(limits);
        labelStripLines = generateLabelStripLines(chartList.length, speedZones);
        let height = (Math.abs(maxY - minY) / DefectScale) * mmToPixel + 13;
        if (height < 10 || height === Infinity) {
          height = 10;
        }
        if (chartList.length === 7) {
          height = 133;
        }

        const getPriorityNumber = (priorityLabel) => {
          switch (priorityLabel) {
            case "al":
              return 1;
            case "il":
              return 2;
            case "ial":
              return 3;
            default:
              return 0;
          }
        };
        const getPeakMeanAndLength = (areaChartData) => {
          const allData = [];
          let minPixelsForLengthOverlap = 16;
          areaChartData.forEach((areaData, index) => {
            if (areaData.dataPoints.length <= 1 || areaData.severityFlag === "")
              return;
            const lengthAndPeakData = [];
            const areaStartLocalization = areaData.dataPoints[0].x;
            const areaEndLocalization =
              areaData.dataPoints[areaData.dataPoints.length - 1].x;
            const isMaxPeak =
              areaData.dataPoints[Math.ceil(areaData.dataPoints.length / 2)].y >
              0;
            let maxY = -Infinity;
            let minY = +Infinity;
            const diff = areaEndLocalization - areaStartLocalization;
            const xValue = (areaEndLocalization + areaStartLocalization) / 2;
            const priority = getPriorityNumber(
              areaData.severityFlag.toLowerCase()
            );
            const currentLengthData = {
              x: xValue,
              y: isMaxPeak ? -3 : 3,
              indexLabel: diff.toFixed(1),
              indexLabelOrientation: "horizontal",
              indexLabelFontSize: 8,
              indexLabelFontWeight: "bolder",
              indexLabelBackgroundColor: "transparent",
              priority,
            };
            lengthAndPeakData.push(currentLengthData);

            areaData.dataPoints.forEach((point) => {
              if (isMaxPeak) {
                if (maxY < point.y) {
                  maxY = point.y;
                }
                return;
              }
              if (minY > point.y) {
                minY = point.y;
              }
            });
            lengthAndPeakData.push({
              x: areaData.dataPoints[Math.ceil(areaData.dataPoints.length / 2)]
                .x,
              y: isMaxPeak ? 5 : -5,
              indexLabel: Math.abs(isMaxPeak ? maxY : minY).toFixed(1),
              indexLabelOrientation: "vertical",
              indexLabelFontSize: 8,
              indexLabelFontWeight: "bolder",
              indexLabelBackgroundColor: "transparent",
              priority,
            });
            const handleLengthOverlap = (currlengthPeak) => {
              if (!allData.length) {
                return;
              }
              const prevLength = allData[allData.length - 1][0].x;
              const prevPeak = allData[allData.length - 1][1].x;
              const isPrevMaxPeak = allData[allData.length - 1][1].y < 0; //length data shown below refernce line
              const prevPriority = allData[allData.length - 1][0].priority;
              const currLength = currlengthPeak[0].x;
              const currPeak = currlengthPeak[1].x;
              const currPriority = currlengthPeak[0].priority;
              const isCurrMaxPeak = currlengthPeak[1].y < 0;
              const insertData = [];
              //check if two x coordinates for length have distance less than 30 i.e overlaps
              if (
                isPrevMaxPeak === isCurrMaxPeak &&
                getXAxisDistanceInPixel(currLength - prevLength) <
                  minPixelsForLengthOverlap
              ) {
                //check priority
                if (currPriority > prevPriority) {
                  //if prev data has lower priority then remove it from all data && push new data
                  allData[allData.length - 1][0].indexLabelFontColor =
                    "transparent";
                  // allData.push(currlengthPeak);
                } else {
                  currlengthPeak[0].indexLabelFontColor = "transparent";
                }
              }
              //check if two x coordinates for peak have distance less than 10 i.e overlaps
              if (
                isPrevMaxPeak === isCurrMaxPeak &&
                getXAxisDistanceInPixel(currPeak - prevPeak) < 10
              ) {
                //check priority
                if (currPriority > prevPriority) {
                  //if prev data has lower priority then remove it from all data && push new data
                  allData[allData.length - 1][1].indexLabelFontColor =
                    "transparent";
                  // allData.push(currlengthPeak);
                } else {
                  currlengthPeak[1].indexLabelFontColor = "transparent";
                }
              }
              // if (isPrevMaxPeak !== isCurrMaxPeak) {
              // } {
              //   if (isCurrMaxPeak && getXAxisDistanceInPixel(currLength - prevPeak) < minPixelsForLengthOverlap) {

              //   }
              // }
              allData.push(currlengthPeak);
              // if (isPrevMaxPeak === isCurrMaxPeak &&
              //   getXAxisDistanceInPixel(currLength - prevLength) <
              //   10
              //   ) {

              // }
            };

            if (!allData.length) {
              allData.push(lengthAndPeakData);
            } else {
              handleLengthOverlap(lengthAndPeakData);
            }
          });
          const scatterChartPoints = [];
          allData.forEach((data) => {
            scatterChartPoints.push(data[0]);
            scatterChartPoints.push(data[1]);
          });
          return {
            type: "scatter",
            highlightEnabled: false,
            fillOpacity: 0,
            dataPoints: scatterChartPoints,
          };
        };
        const peakAndLengthDataPoints = getPeakMeanAndLength(areaChartData);

        chartList.push({
          height: height,
          backgroundColor:
            chartList.length % 2 === 0 ? "#efefef" : "transparent",
          axisX2: {
            minimum: StationingStart - 0.2 * widthRatio,
            maximum: StationingEnd + 0.2 * widthRatio,
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
          },
          axisY: {
            titleWrap: false,
            lineThickness: 0,
            gridThickness: 0,
            tickLength: 0,
            maximum: maxY + 1,
            minimum: minY - (height < 40 ? (DefectScale > 8 ? 8 : 5) : 2),
            labelFormatter: () => "",
            labelAutoFit: true,
            labelFontSize: 11,
            stripLines: yAxisLabels.map((yAxisLabel, index) => ({
              value: yAxisLabel,
              labelAutoFit: true,
              labelPlacement: "outside",
              lineDashType: "solid",
              color: yAxisLabel === 0 ? "#000" : "transparent",
              label:
                !showReferenceLineLabel && yAxisLabel === 0
                  ? ""
                  : yAxisLabel.toString(),
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
            minimum: StationingStart - 0.2 * widthRatio,
            maximum: StationingEnd + 0.2 * widthRatio,
            tickLength: 0,
            labelAutoFit: true,
            labelWrap: false,
            labelFontWeight: "lighter",
            labelFontSize: 10,
            labelFormatter: () => "",
            labelAngle: 270,
            stripLines: [...labelStripLines],
            gridThickness: 0,
            lineThickness: 0,
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
            peakAndLengthDataPoints,
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
          height = (Math.abs(newMax - newMin) / DefectScale) * mmToPixel + 13;
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
        generateChartElement(index, param.columnName);
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
        const referenceLineInTopHalf = (halfOfColumnHeight) => {
          return amplitude < halfOfColumnHeight;
        };
        if (index < 7) {
          const columnHeight = 131;
          let sign = "+";
          if (!referenceLineInTopHalf(columnHeight / 2)) {
            sign = "-";
          }
          document.querySelector(
            `.${chartContainerClass} .chart-${index + 1}`
          ).style.transform = `translate(0, ${sign}${Math.abs(
            columnHeight / 2 - amplitude
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
    generateContinuousLines(
      index,
      labelStripLines,
      continuousLocalizationPoints,
      speedZones
    );
    document.querySelector(`.${chartContainerClass}`).style.width = `${
      PageWidth + 38
    }px`;
    document.querySelector(
      `.${chartContainerClass}`
    ).parentNode.style.maxHeight = `${PageWidth + 38 + 4}px`;
  }
};
