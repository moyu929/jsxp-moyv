import type { FC } from "react";
interface BackgroundImageProps {
    src?: string | string[];
    url?: string;
    size?: string;
    style?: React.CSSProperties;
    [key: string]: any;
}
export declare const BackgroundImage: FC<BackgroundImageProps>;
export {};
