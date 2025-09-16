import { jsx, Fragment } from 'react/jsx-runtime';
import { readFileSync } from 'fs';

/**
 * 引入 ESM 文件
 */
const LinkESM = (props) => {
    const { children, src, ...rest } = props;
    return jsx("script", { type: "module", src: src, ...rest });
};
/**
 * 读取文件内容并作为 ESM 文件引入
 */
const LinkESMFile = (props) => {
    const { src, ...rest } = props;
    try {
        const data = readFileSync(src, "utf-8");
        return (jsx("script", { type: "module", ...rest, dangerouslySetInnerHTML: { __html: data } }));
    }
    catch (e) {
        return jsx(Fragment, {});
    }
};

export { LinkESM, LinkESMFile };
