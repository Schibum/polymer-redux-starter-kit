/* global System: false */
System.config({
     babelOptions: {
       stage1: true,
       es2015: false
     },
  transpiler: 'plugin-babel',
  map: {
   'plugin-babel': 'node_modules/systemjs-plugin-babel/plugin-babel.js',
   'systemjs-babel-build': 'node_modules/systemjs-plugin-babel/systemjs-babel-browser.js'
 },
  baseURL: './'
});
