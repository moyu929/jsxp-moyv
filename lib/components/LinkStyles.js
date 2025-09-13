import React from 'react';

const LinkStyleSheet = ({ src, ...props }) => React.createElement("link", { rel: "stylesheet", href: src, ...props });

export { LinkStyleSheet };
