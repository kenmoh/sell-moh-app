import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedProps,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle, Line, Path, Rect, Text as SvgText } from "react-native-svg";

import ChartTooltip from "./ChartTooltip";
import { useChartWidth } from "./use-chart-width";

export interface LineDatum {
  label: string;
  value: number;
  /** The day this point stands for; the tooltip's heading. */
  title?: string;
  /** Tooltip detail lines, e.g. balance and the day's change. */
  lines?: string[];
}

export interface LineChartProps {
  data: LineDatum[];
  height?: number;
  color?: string;
  labelColor?: string;
  formatValue?: (value: number) => string;
  emptyLabel?: string;
}

const TOP_PAD = 16;
const LABEL_ROW = 16;
const MAX_TICKS = 6;
const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);
const AREA_DURATION = 300;
const DRAW_DURATION = 400;
const DOT_DELAY = 340;

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/** A step through the days: one point each, joined, with the last highlighted. */
export default function LineChart({
  data,
  height = 130,
  color = "#3b82f6",
  labelColor = "#9ca3af",
  formatValue = (value) => String(Math.round(value)),
  emptyLabel = "No stock movements yet",
}: LineChartProps) {
  const [width, onLayout] = useChartWidth();
  const [point, setPoint] = useState<{ key: string; index: number } | null>(
    null,
  );

  const reduce = useReducedMotion();
  const draw = useSharedValue(0);
  const areaFade = useSharedValue(0);
  const dotFade = useSharedValue(0);

  const seriesKey = data.map((datum) => `${datum.label}:${datum.value}`).join("|");
  // A selection from older data is simply not shown — no reset effect.
  const active =
    point && point.key === seriesKey && point.index < data.length
      ? point.index
      : null;

  // New data (range switch) restarts the draw.
  useEffect(() => {
    if (reduce) {
      draw.value = 1;
      areaFade.value = 1;
      dotFade.value = 1;
      return;
    }
    draw.value = 0;
    areaFade.value = 0;
    dotFade.value = 0;
    areaFade.value = withTiming(1, { duration: AREA_DURATION, easing: EASE_OUT });
    draw.value = withTiming(1, { duration: DRAW_DURATION, easing: EASE_OUT });
    dotFade.value = withDelay(
      DOT_DELAY,
      withTiming(1, { duration: 180, easing: EASE_OUT }),
    );
  }, [seriesKey, reduce, draw, areaFade, dotFade]);

  const chartHeight = height;
  const svgHeight = chartHeight + LABEL_ROW;

  const values = data.map((d) => d.value);
  const min = values.length ? Math.min(...values) : 0;
  const max = values.length ? Math.max(...values) : 0;
  const usable = chartHeight - TOP_PAD;
  const yFor = (value: number) =>
    max === min
      ? chartHeight - usable / 2
      : TOP_PAD + (1 - (value - min) / (max - min)) * usable;
  const xFor = (index: number) =>
    data.length > 1 ? (index * width) / (data.length - 1) : width / 2;

  const points = data.map((datum, index) => ({
    x: xFor(index),
    y: yFor(datum.value),
  }));
  // The path is straight segments, so the length is ours to compute —
  // enough for a stroke-dash draw without measuring the rendered node.
  const lineLength = points.reduce(
    (total, point, index) =>
      index === 0
        ? 0
        : total +
          Math.hypot(point.x - points[index - 1].x, point.y - points[index - 1].y),
    0,
  );
  const linePath = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x},${point.y}`)
    .join(" ");
  const areaPath = `${linePath} L ${xFor(data.length - 1)},${chartHeight} L ${xFor(0)},${chartHeight} Z`;
  const tickStep = Math.max(1, Math.ceil(data.length / MAX_TICKS));

  // Column boundaries fall midway between points, so every press lands
  // on its own day even though the edge points sit at 0 and width.
  const boundaries = points.map((point, index) => {
    if (index === 0) return 0;
    return (points[index - 1].x + point.x) / 2;
  });
  boundaries.push(width);

  const drawnLineProps = useAnimatedProps(() => ({
    strokeDashoffset: lineLength * (1 - draw.value),
  }));
  const areaProps = useAnimatedProps(() => ({
    opacity: areaFade.value * 0.12,
  }));
  const dotProps = useAnimatedProps(() => ({
    opacity: dotFade.value,
    r: 3.5 * (0.7 + 0.3 * dotFade.value),
  }));

  if (data.length === 0) {
    return (
      <View onLayout={onLayout} style={{ height: svgHeight }}>
        <Text style={[styles.empty, { color: labelColor }]}>{emptyLabel}</Text>
      </View>
    );
  }

  const picked = active;
  const tipDatum = picked !== null ? data[picked] : null;

  return (
    <View onLayout={onLayout}>
      {width > 0 ? (
        <>
          <Svg width={width} height={svgHeight}>
            <SvgText x={0} y={10} fontSize={10} fill={labelColor}>
              {formatValue(max)}
            </SvgText>
            <AnimatedPath
              d={areaPath}
              fill={color}
              animatedProps={areaProps}
            />
            <AnimatedPath
              d={linePath}
              stroke={color}
              strokeWidth={2}
              fill="none"
              strokeDasharray={lineLength}
              animatedProps={drawnLineProps}
            />
            <AnimatedCircle
              cx={xFor(data.length - 1)}
              cy={yFor(values[values.length - 1])}
              fill={color}
              animatedProps={dotProps}
            />
            <Line
              x1={0}
              y1={chartHeight}
              x2={width}
              y2={chartHeight}
              stroke={labelColor}
              strokeWidth={1}
              opacity={0.5}
            />
            {data.map((datum, index) =>
              index % tickStep === 0 ? (
                <SvgText
                  key={`tick-${datum.label}-${index}`}
                  x={xFor(index)}
                  y={chartHeight + 12}
                  fontSize={9}
                  fill={labelColor}
                  textAnchor={
                    index === 0
                      ? "start"
                      : index === data.length - 1
                        ? "end"
                        : "middle"
                  }
                >
                  {datum.label}
                </SvgText>
              ) : null,
            )}
            {picked !== null ? (
              <Circle
                cx={xFor(picked)}
                cy={yFor(data[picked].value)}
                r={4}
                fill={color}
              />
            ) : null}
            {/* Press anywhere off-point to dismiss. */}
            <Rect
              x={0}
              y={0}
              width={width}
              height={chartHeight}
              fill={labelColor}
              fillOpacity={0.001}
              onPress={() => setPoint(null)}
            />
            {/* One column per day, so every press lands on a point. */}
            {data.map((datum, index) => (
              <Rect
                key={`hit-${datum.label}-${index}`}
                x={boundaries[index]}
                y={0}
                width={boundaries[index + 1] - boundaries[index]}
                height={chartHeight}
                fill={labelColor}
                fillOpacity={picked === index ? 0.06 : 0.001}
                onPress={() =>
                  setPoint((current) =>
                    current &&
                    current.key === seriesKey &&
                    current.index === index
                      ? null
                      : { key: seriesKey, index },
                  )
                }
              />
            ))}
          </Svg>
          <ChartTooltip
            visible={picked !== null}
            anchorX={picked !== null ? xFor(picked) : 0}
            anchorY={picked !== null ? yFor(data[picked].value) : 0}
            chartWidth={width}
            title={tipDatum?.title ?? tipDatum?.label ?? ""}
            lines={tipDatum?.lines ?? []}
          />
        </>
      ) : (
        <View style={{ height: svgHeight }} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    fontSize: 12,
    textAlign: "center",
    paddingTop: 48,
  },
});
