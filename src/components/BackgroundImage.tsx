import type { FC } from "react";

interface BackgroundImageProps {
  src?: string | string[];
  url?: string;
  size?: string;
  style?: React.CSSProperties;
  [key: string]: any;
}

export const BackgroundImage: FC<BackgroundImageProps> = (props) => {
  let { src, url, size = "100% auto", style, ...rest } = props;
  if (url) src = url;

  return (
    <div
      style={{
        backgroundImage: Array.isArray(src)
          ? src.map((url) => `url(${url})`).join(",")
          : `url(${src})`,
        backgroundSize: size,
        ...style,
      }}
      {...rest}
    />
  );
};
