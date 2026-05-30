const React = require('react');
const { Text } = require('react-native');

const Icon = ({ name, ...props }) => React.createElement(Text, props, name);
Icon.Button = ({ children, ...props }) => React.createElement(Text, props, children);
Icon.getImageSource = () => Promise.resolve({});
Icon.getImageSourceSync = () => ({});
Icon.loadFont = () => Promise.resolve();
Icon.hasIcon = () => true;
Icon.getRawGlyphMap = () => ({});

module.exports = Icon;
module.exports.default = Icon;
