"use strict";

/* eslint-disable react/no-danger */
var React = require('react');

var PropTypes = require('prop-types');

function MainHTML(props) {
  var data = props.data,
      inlineScripts = props.inlineScripts,
      inlineStyles = props.inlineStyles,
      options = props.options,
      scriptsUrl = props.scriptsUrl,
      stylesUrl = props.stylesUrl,
      title = props.title,
      useInlineAssets = props.useInlineAssets;
  return React.createElement("html", {
    lang: "en"
  }, React.createElement("head", null, React.createElement("meta", {
    charSet: "utf-8"
  }), React.createElement("meta", {
    httpEquiv: "X-UA-Compatible",
    content: "IE=edge"
  }), React.createElement("meta", {
    name: "viewport",
    content: "width=device-width, initial-scale=1"
  }), React.createElement("title", null, title), useInlineAssets ? React.createElement("style", {
    dangerouslySetInnerHTML: {
      __html: inlineStyles
    }
  }) : React.createElement("link", {
    rel: "stylesheet",
    href: stylesUrl
  })), React.createElement("body", {
    "data-raw": data,
    "data-config": JSON.stringify(options)
  }, React.createElement("div", {
    id: "report"
  }), useInlineAssets ? React.createElement("script", {
    type: "text/javascript",
    dangerouslySetInnerHTML: {
      __html: inlineScripts
    }
  }) : React.createElement("script", {
    src: scriptsUrl
  })));
}

MainHTML.propTypes = {
  data: PropTypes.string,
  inlineScripts: PropTypes.string,
  inlineStyles: PropTypes.string,
  options: PropTypes.object,
  scriptsUrl: PropTypes.string,
  stylesUrl: PropTypes.string,
  title: PropTypes.string,
  useInlineAssets: PropTypes.bool
};
module.exports = MainHTML;