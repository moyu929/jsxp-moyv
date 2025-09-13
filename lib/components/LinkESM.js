import React from 'react';
import { readFileSync } from 'fs';

/**
 * 引入 ESM 文件
 * @param param0
 * @returns
 */
const LinkESM = (props) => {
    const { children, src, ...rest } = props;
    return React.createElement("script", { type: "module", src: src, ...rest });
};
/**
 * 读取文件内容并作为 ESM 文件引入
 * @param param0
 * @returns
 */
const LinkESMFile = (props) => {
    const { src, ...rest } = props;
    try {
        const data = readFileSync(src, 'utf-8');
        return (React.createElement("script", { type: "module", ...rest }, data));
    }
    catch (e) {
        return React.createElement(React.Fragment, null);
    }
};

export { LinkESM, LinkESMFile };
