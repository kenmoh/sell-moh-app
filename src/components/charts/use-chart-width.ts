import { useCallback, useState } from "react";
import type { LayoutChangeEvent } from "react-native";

/** Measure the width available to a chart; SVG needs it before it can lay out. */
export function useChartWidth(): [number, (event: LayoutChangeEvent) => void] {
  const [width, setWidth] = useState(0);
  const onLayout = useCallback(
    (event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width),
    [],
  );
  return [width, onLayout];
}
