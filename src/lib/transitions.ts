import { interpolate, Extrapolation } from "react-native-reanimated";

export const iosSlide = {
  enableTransitions: true,
  gestureEnabled: true,
  gestureDirection: "horizontal" as const,
  gestureActivationArea: "edge" as const,
  gestureResponseDistance: 50,
  transitionSpec: {
    open: {
      stiffness: 350,
      damping: 35,
      mass: 1,
      overshootClamping: false,
    },
    close: {
      stiffness: 350,
      damping: 35,
      mass: 1,
      overshootClamping: false,
    },
  },
  screenStyleInterpolator: ({ progress, layouts: { screen } }: any) => {
    "worklet";

    const translateX = interpolate(
      progress,
      [0, 1, 2],
      [screen.width, 0, -screen.width * 0.3],
      Extrapolation.CLAMP,
    );

    const opacity = interpolate(
      progress,
      [0, 0.3, 1, 1.7, 2],
      [0, 0.6, 1, 0.6, 0],
      Extrapolation.CLAMP,
    );

    return {
      contentStyle: {
        transform: [{ translateX }],
        opacity,
      },
    };
  },
};

export const iosSlideSoft = {
  enableTransitions: true,
  gestureEnabled: true,
  gestureDirection: "horizontal" as const,
  gestureActivationArea: "edge" as const,
  gestureResponseDistance: 50,
  transitionSpec: {
    open: {
      stiffness: 300,
      damping: 30,
      mass: 1,
      overshootClamping: false,
    },
    close: {
      stiffness: 300,
      damping: 30,
      mass: 1,
      overshootClamping: false,
    },
  },
  screenStyleInterpolator: ({ progress, layouts: { screen } }: any) => {
    "worklet";

    const translateX = interpolate(
      progress,
      [0, 1, 2],
      [screen.width * 0.4, 0, -screen.width * 0.15],
      Extrapolation.CLAMP,
    );

    const opacity = interpolate(
      progress,
      [0, 0.4, 1, 1.6, 2],
      [0, 0.7, 1, 0.7, 0],
      Extrapolation.CLAMP,
    );

    return {
      contentStyle: {
        transform: [{ translateX }],
        opacity,
      },
    };
  },
};

export const modalTransition = {
  enableTransitions: true,
  gestureEnabled: true,
  gestureDirection: "vertical" as const,
  gestureActivationArea: "screen" as const,
  transitionSpec: {
    open: {
      stiffness: 300,
      damping: 30,
      mass: 1,
      overshootClamping: false,
    },
    close: {
      stiffness: 300,
      damping: 30,
      mass: 1,
      overshootClamping: false,
    },
  },
  screenStyleInterpolator: ({ progress, layouts: { screen } }: any) => {
    "worklet";

    const translateY = interpolate(
      progress,
      [0, 1, 2],
      [screen.height, 0, screen.height * 0.3],
      Extrapolation.CLAMP,
    );

    const opacity = interpolate(
      progress,
      [0, 0.3, 1, 1.7, 2],
      [0, 0.5, 1, 0.5, 0],
      Extrapolation.CLAMP,
    );

    return {
      contentStyle: {
        transform: [{ translateY }],
        opacity,
      },
    };
  },
};
