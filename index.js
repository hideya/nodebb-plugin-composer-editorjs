'use strict';

const plugin = module.exports;

plugin.format = async (data) => {
  const editorData = data.post.editorjsData;
  if (editorData) {
    const markdown = require('./static/lib/json-to-md');
    data.post.content = markdown(JSON.parse(editorData));
  }
  return data;
};

plugin.get = async (data) => {
  if (data.post.content && !data.post.editorjsData) {
    const parser = require('./static/lib/md-to-json');
    data.post.editorjsData = JSON.stringify(parser(data.post.content));
  }
  return data;
};



