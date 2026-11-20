#!/usr/bin/env python3
"""Baut eine einzelne HTML-Datei (alles eingebettet) – z. B. für eine Vorschau als Claude-Artefakt.
Aufruf:  python3 tools/build_single.py   ->  dist/nacht-am-berg.html"""
import re, os
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
html = open(os.path.join(root, 'index.html'), encoding='utf-8').read()
css = open(os.path.join(root, 'css/app.css'), encoding='utf-8').read()
html = html.replace('<link rel="stylesheet" href="css/app.css">', '<style>\n' + css + '\n</style>')
html = re.sub(r'<link rel="(manifest|apple-touch-icon|icon)"[^>]*>\n?', '', html)
html = html.replace('<script src="vendor/three.min.js"></script>',
                    '<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>')
def inline(m):
    src = m.group(1)
    return '<script>\n' + open(os.path.join(root, src), encoding='utf-8').read() + '\n</script>'
html = re.sub(r'<script src="(js/[^"]+)"></script>', inline, html)
os.makedirs(os.path.join(root, 'dist'), exist_ok=True)
out = os.path.join(root, 'dist', 'nacht-am-berg.html')
open(out, 'w', encoding='utf-8').write(html)
print(out, len(html) // 1024, 'KB')
