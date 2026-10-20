import {readFile,writeFile} from 'node:fs/promises';

// Produce one portable HTML page. Inlining classic JavaScript avoids the
// cross-origin module restrictions browsers apply to file:// URLs.
const root=new URL('../',import.meta.url);
const read=path=>readFile(new URL(path,root),'utf8');
const [html,css,model,app]=await Promise.all([
  read('index.html'),read('src/style.css'),read('src/model.js'),read('src/app.js')
]);
const moduleImport="import {models,results,normalize,sample,residualForecast,forecast,demoMetrics} from './model.js';";
if(!app.startsWith(moduleImport)) throw new Error('App imports changed; update the standalone builder.');
const javascript=`'use strict';\n(()=>{\n${model.replace(/^export /gm,'')}\n${app.slice(moduleImport.length)}\n})();`;
const styles='<style>\n'+css.replace(/<\/style/gi,'<\\/style')+'\n</style>';
const script='<script>\n'+javascript.replace(/<\/script/gi,'<\\/script')+'\n</script>';
const output=html
  .replace('<link rel="stylesheet" href="src/style.css">',()=>styles)
  .replace('<script type="module" src="src/app.js"></script>',()=>script);
if(output===html || output.includes('src="src/app.js"') || output.includes('href="src/style.css"')){
  throw new Error('Standalone HTML substitution failed.');
}
await writeFile(new URL('current.html',root),output);
console.log('Built current.html — open directly in a browser; no server or network needed.');
