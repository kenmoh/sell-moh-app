import { StyleSheet, Text, View } from "react-native";
import Svg, { Line, Rect, Text as SvgText } from "react-native-svg";

import { useChartWidth } from "./use-chart-width";

export interface BarDatum {
  label: string;
  value: number;
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

  return (
    <View onLayout={onLayout}>
      {width > 0 ? (
        <Svg width={width} height={svgHeight}>
          <SvgText x={0} y={10} fontSize={10} fill={labelColor}>
            {formatValue(max)}
          </SvgText>
          {data.map((datum, index) => {
            const barHeight =
              datum.value > 0
                ? Math.max(2, (datum.value / max) * usable)
                : 0;
            const x = index * slot + gap / 2;
            return (
              <Rect
                key={`${datum.label}-${index}`}
                x={x}
                y={chartHeight - barHeight}
                width={barWidth}
                height={barHeight}
                rx={Math.min(3, barWidth / 2)}
                fill={color}
              />
            );
          })}
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
        </Svg>
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
