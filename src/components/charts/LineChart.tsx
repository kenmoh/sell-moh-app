import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Line, Path, Text as SvgText } from "react-native-svg";

import { useChartWidth } from "./use-chart-width";

export interface LineDatum {
  label: string;
  value: number;
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

  const chartHeight = height;
  const svgHeight = chartHeight + LABEL_ROW;

  if (data.length === 0) {
    return (
      <View onLayout={onLayout} style={{ height: svgHeight }}>
        <Text style={[styles.empty, { color: labelColor }]}>{emptyLabel}</Text>
      </View>
    );
  }

  const values = data.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const usable = chartHeight - TOP_PAD;
  const yFor = (value: number) =>
    max === min
      ? chartHeight - usable / 2
      : TOP_PAD + (1 - (value - min) / (max - min)) * usable;
  const xFor = (index: number) =>
    data.length > 1 ? (index * width) / (data.length - 1) : width / 2;

  const tickStep = Math.max(1, Math.ceil(data.length / MAX_TICKS));

  return (
    <View onLayout={onLayout}>
      {width > 0 ? (
        <Svg width={width} height={svgHeight}>
          <SvgText x={0} y={10} fontSize={10} fill={labelColor}>
            {formatValue(max)}
          </SvgText>
          <Path
            d={
              data
                .map((datum, index) =>
                  `${index === 0 ? "M" : "L"} ${xFor(index)},${yFor(datum.value)}`,
                )
                .join(" ") +
              ` L ${xFor(data.length - 1)},${chartHeight} L ${xFor(0)},${chartHeight} Z`
            }
            fill={color}
            opacity={0.12}
          />
          <Path
            d={data
              .map((datum, index) =>
                `${index === 0 ? "M" : "L"} ${xFor(index)},${yFor(datum.value)}`,
              )
              .join(" ")}
            stroke={color}
            strokeWidth={2}
            fill="none"
          />
          <Circle
            cx={xFor(data.length - 1)}
            cy={yFor(values[values.length - 1])}
            r={3.5}
            fill={color}
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
                  index === 0 ? "start" : index === data.length - 1 ? "end" : "middle"
                }
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
