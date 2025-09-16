import { jsx } from 'react/jsx-runtime';

const BackgroundImage = (props) => {
    let { src, url, size = '100% auto', style, ...rest } = props;
    if (url)
        src = url;
    return (jsx("div", { style: {
            backgroundImage: Array.isArray(src)
                ? src.map((url) => `url(${url})`).join(',')
                : `url(${src})`,
            backgroundSize: size,
            ...style,
        }, ...rest }));
};

export { BackgroundImage };
