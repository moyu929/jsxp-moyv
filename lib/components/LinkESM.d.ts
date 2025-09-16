import type { FC, ReactNode } from "react";
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
export declare const LinkESM: FC<LinkESMProps>;
/**
 * 读取文件内容并作为 ESM 文件引入
 */
export declare const LinkESMFile: FC<LinkESMFileProps>;
export {};
