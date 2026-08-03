import React, { ComponentType } from "react";
import { TextProps } from "react-native";

export type WrapperProps = TextProps & {
  title?: string;
  children: React.ReactNode;
};

declare const Wrapper: ComponentType<WrapperProps>;
export default Wrapper;
