import type { FC } from "react";

interface LinkStyleSheetProps {
  src: string;
  [key: string]: any;
}

export const LinkStyleSheet: FC<LinkStyleSheetProps> = ({ src, ...props }) => (
  <link rel="stylesheet" href={src} {...props} />
);
