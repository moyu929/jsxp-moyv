import type { FC, ReactNode } from "react";
import { readFileSync } from "fs";

interface LinkESMProps {
  src: string;
  children?: ReactNode;
  [key: string]: any;
}

interface LinkESMFileProps {
  src: string;
  [key: string]: any;
}

/**
 * 引入 ESM 文件
 */
export const LinkESM: FC<LinkESMProps> = (props) => {
  const { children, src, ...rest } = props;
  return <script type="module" src={src} {...rest} />;
};

/**
 * 读取文件内容并作为 ESM 文件引入
 */
export const LinkESMFile: FC<LinkESMFileProps> = (props) => {
  const { src, ...rest } = props;
  try {
    const data = readFileSync(src, "utf-8");
    return (
      <script
        type="module"
        {...rest}
        dangerouslySetInnerHTML={{ __html: data }}
      />
    );
  } catch (e) {
    return <></>;
  }
};
