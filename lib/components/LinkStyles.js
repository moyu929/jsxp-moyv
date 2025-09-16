import { jsx } from 'react/jsx-runtime';

const LinkStyleSheet = ({ src, ...props }) => (jsx("link", { rel: "stylesheet", href: src, ...props }));

export { LinkStyleSheet };
