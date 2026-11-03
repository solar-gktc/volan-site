# Assemble the option pages: src/<name>.html + shared fragments -> ../<name>.html
import pathlib, re
here = pathlib.Path(__file__).parent
frag = {k: (here / f'_{k}.html').read_text(encoding='utf-8') for k in ('defs', 'iletisim', 'kapanis')}
# The menu is taken live from the real page so the mocks follow the site menu.
src = (here / '../../../../../hakkimizda.html').read_text(encoding='utf-8')
menu = src[src.index('<!-- menu -->'):src.index('<!-- /menu -->') + len('<!-- /menu -->')]
def fix(m):
    if re.match(r'(https?:|tel:|mailto:|#)', m.group(2)): return m.group(0)
    return f'{m.group(1)}="../../../../{m.group(2)}"'
menu = re.sub(r'(href|src)="([^"]*)"', fix, menu)
frag['menu'] = menu.replace('../../../../hakkimizda.html" aria-current="page"', '#" aria-current="page"')
head = '''<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#323277">
<link rel="icon" href="../../../../assets/img/logo-oval.svg" type="image/svg+xml">
<link rel="stylesheet" href="../../../../assets/fonts/fonts.css">
<link rel="stylesheet" href="../../../../assets/css/site.css">
<link rel="stylesheet" href="../../../../assets/css/menu.css">
<link rel="stylesheet" href="ortak/ortak.css">
<script type="importmap">{ "imports": { "three": "../../../../assets/vendor/three.bundle.min.js" } }</script>
<script type="module" src="ortak/murekkep.js"></script>
<script type="module" src="ortak/arac.js"></script>
<script type="module" src="ortak/iletisim.js"></script>
<script src="../../../../assets/js/menu.js" defer></script>'''
for f in here.glob('[a-z]*.html'):
    s = f.read_text(encoding='utf-8')
    s = s.replace('<!--HEAD-->', head)
    for k, v in frag.items():
        s = s.replace(f'<!--{k.upper()}-->', v)
    (here.parent / f.name).write_text(s, encoding='utf-8')
    print('wrote', f.name)
