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
import Svg, { Line, Rect, Text as SvgText } from "react-native-svg";

import ChartTooltip from "./ChartTooltip";
import { useChartWidth } from "./use-chart-width";

export interface BarDatum {
  label: string;
  value: number;
  /** The day this bar stands for; the tooltip's heading. */
  title?: string;
  /** Tooltip detail lines, e.g. units and revenue. */
  lines?: string[];
}

export interface BarChartProps {
  data: BarDatum[];
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
const BAR_DURATION = 300;
const STAGGER = 240;

const AnimatedRect = Animated.createAnimatedComponent(Rect);

function AnimatedBar({
  x,
  width,
  target,
  chartHeight,
  color,
  delay,
}: {
  x: number;
  width: number;
  target: number;
  chartHeight: number;
  color: string;
  delay: number;
}) {
  const reduce = useReducedMotion();
  const h = useSharedValue(0);

  useEffect(() => {
    if (reduce) {
      h.value = target;
      return;
    }
    h.value = withDelay(
      delay,
      withTiming(target, { duration: BAR_DURATION, easing: EASE_OUT }),
    );
  }, [target, delay, reduce, h]);

  const animatedProps = useAnimatedProps(() => ({
    height: h.value,
    y: chartHeight - h.value,
  }));

  return (
    <AnimatedRect
      x={x}
      width={width}
      rx={Math.min(3, width / 2)}
      fill={color}
      animatedProps={animatedProps}
    />
  );
}

/** One bar per day; ticks and a max caption are all the axis there is. */
export default function BarChart({
  data,
  height = 130,
  color = "#3b82f6",
  labelColor = "#9ca3af",
  formatValue = (value) => String(Math.round(value)),
  emptyLabel = "No activity in this period",
}: BarChartProps) {
  const [width, onLayout] = useChartWidth();
  const [point, setPoint] = useState<{ key: string; index: number } | null>(
    null,
  );

  const seriesKey = data.map((datum) => `${datum.label}:${datum.value}`).join("|");
  // A selection from older data is simply not shown — no reset effect.
  const active =
    point && point.key === seriesKey && point.index < data.length
      ? point.index
      : null;

  const max = data.reduce((peak, d) => Math.max(peak, d.value), 0);
  const chartHeight = height;
  const svgHeight = chartHeight + LABEL_ROW;

  if (max <= 0) {
    return (
      <View onLayout={onLayout} style={{ height: svgHeight }}>
        <Text style={[styles.empty, { color: labelColor }]}>{emptyLabel}</Text>
      </View>
    );
  }

  const slot = width / Math.max(data.length, 1);
  const gap = Math.max(2, Math.min(6, slot * 0.3));
  const barWidth = Math.max(2, slot - gap);
  const usable = chartHeight - TOP_PAD;
  const tickStep = Math.max(1, Math.ceil(data.length / MAX_TICKS));
  const barHeight = (value: number) =>
    value > 0 ? Math.max(2, (value / max) * usable) : 0;

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
            {data.map((datum, index) => (
              <AnimatedBar
                key={`${datum.label}-${index}`}
                x={index * slot + gap / 2}
                width={barWidth}
                target={barHeight(datum.value)}
                chartHeight={chartHeight}
                color={color}
                delay={(index / data.length) * STAGGER}
              />
            ))}
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
                  x={index * slot + slot / 2}
                  y={chartHeight + 12}
                  fontSize={9}
                  fill={labelColor}
                  textAnchor="middle"
                >
                  {datum.label}
                </SvgText>
              ) : null,
            )}
            {/* Press anywhere off-column to dismiss. */}
            <Rect
              x={0}
              y={0}
              width={width}
              height={chartHeight}
              fill={labelColor}
              fillOpacity={0.001}
              onPress={() => setPoint(null)}
            />
            {/* One full-height column per day, so thin bars stay tappable. */}
            {data.map((datum, index) => (
              <Rect
                key={`hit-${datum.label}-${index}`}
                x={index * slot}
                y={0}
                width={slot}
                height={chartHeight}
                fill={labelColor}
                fillOpacity={picked === index ? 0.08 : 0.001}
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
            anchorX={picked !== null ? picked * slot + slot / 2 : 0}
            anchorY={
              picked !== null ? chartHeight - barHeight(data[picked].value) : 0
            }
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
