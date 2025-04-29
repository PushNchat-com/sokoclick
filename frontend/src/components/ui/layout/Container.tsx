import React, { CSSProperties } from "react";
import { spacing } from "../design-system/tokens";

type ContainerProps = {
  children: React.ReactNode;
  maxWidth?: "xs" | "sm" | "md" | "lg" | "xl" | "full" | "none";
  padding?: keyof typeof spacing;
  centerContent?: boolean;
  className?: string;
  id?: string;
};

const maxWidthMap = {
  xs: "20rem", // 320px
  sm: "36rem", // 576px
  md: "48rem", // 768px
  lg: "64rem", // 1024px
  xl: "80rem", // 1280px
  full: "100%",
  none: "none",
};

export const Container: React.FC<ContainerProps> = ({
  children,
  maxWidth = "lg",
  padding = "md",
  centerContent = false,
  className = "",
  id,
}) => {
  const containerStyle: CSSProperties = {
    width: "100%",
    maxWidth: maxWidthMap[maxWidth],
    padding:
      maxWidth === "full"
        ? "0"
        : `0 ${spacing[padding as keyof typeof spacing]}`,
    margin: "0 auto",
    display: centerContent ? "flex" : "block",
    flexDirection: centerContent ? ("column" as const) : undefined,
    alignItems: centerContent ? ("center" as const) : undefined,
  };

  return (
    <div className={className} style={containerStyle} id={id}>
      {children}
    </div>
  );
};

export default Container;
