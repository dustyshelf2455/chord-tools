import re,shutil,os
here=os.path.dirname(os.path.abspath(__file__)); root=os.path.dirname(here)
strip=lambda s:re.sub(r"\nif\(typeof module!=='undefined'\)module\.exports=.*\n","\n",s)
ui=open(here+'/ui.html').read()
page=ui.replace('/*ENGINE*/',strip(open(here+'/engine.js').read())).replace('/*LEGACY*/',strip(open(here+'/legacy.js').read()))
s=page.replace('<meta name="claude:viewport-fit-sides" content="cover">\n','')
first,rest=s.split('\n',1); i=rest.index('</style>')+8
html=('<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
 '<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0}img{max-width:100%}[hidden]{display:none!important}</style>\n'
 +first+'\n'+rest[:i]+'\n</head>\n<body>\n'+rest[i:]+'\n</body>\n</html>\n')
open(root+'/index.html','w').write(html)             # standalone version for GitHub Pages
shutil.copy(here+'/sw.js',root+'/sw.js')
print('built',len(page)//1024,'KB')
