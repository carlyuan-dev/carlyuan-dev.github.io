"""Generate complete unicode-range WOFF2 shards. Requires fontTools + brotli.
Run after an initial Hexo build: python3 tools/subset-font.py; npm run build.
"""
from pathlib import Path
from html.parser import HTMLParser
from fontTools.ttLib import TTFont
from fontTools import subset
import json
ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'source/fonts/tsanger-jinkai-04-w04.ttf'
OUT = ROOT / 'source/fonts/jinkai'
OUT.mkdir(exist_ok=True)
class Text(HTMLParser):
    def __init__(self):
        super().__init__(); self.chars=set(range(32,127)); self.skip=0
    def handle_starttag(self, tag, attrs):
        if tag in ('script','style'): self.skip+=1
    def handle_endtag(self, tag):
        if tag in ('script','style'): self.skip=max(0,self.skip-1)
    def handle_data(self, data):
        if not self.skip: self.chars.update(map(ord,data))
parser=Text()
for page in (ROOT/'public').rglob('*.html'): parser.feed(page.read_text())
parser.chars.update(map(ord,'搜索文章输入标题标签或正文中的关键词正在载入索引失败请重试没有找到相关文章篇显示个分组'))
font=TTFont(SOURCE); coverage=set(font.getBestCmap()); font.close()
base=coverage & parser.chars
remaining=sorted(coverage-base)
groups=[('base',sorted(base))]+[(f'part-{i//512:03}',remaining[i:i+512]) for i in range(0,len(remaining),512)]
rules=[]; sizes={}; actual=set()
for name, codes in groups:
    options=subset.Options(); options.flavor='woff2'
    font=subset.load_font(str(SOURCE),options)
    worker=subset.Subsetter(options=options); worker.populate(unicodes=codes); worker.subset(font)
    dest=OUT/(name+'.woff2'); subset.save_font(font,str(dest),options); font.close()
    check=TTFont(dest); actual.update(check.getBestCmap()); check.close()
    sizes[name]=dest.stat().st_size
    runs=[]
    start=end=codes[0]
    for code in codes[1:]:
        if code==end+1: end=code
        else:
            runs.append(f'U+{start:X}' if start==end else f'U+{start:X}-{end:X}')
            start=end=code
    runs.append(f'U+{start:X}' if start==end else f'U+{start:X}-{end:X}')
    ranges=','.join(runs)
    rules.append("@font-face{font-family:'Tsanger JinKai';font-style:normal;font-weight:400;font-display:swap;src:url('/fonts/jinkai/"+name+".woff2') format('woff2');unicode-range:"+ranges+";}")
assert actual==coverage, 'Character coverage changed'
(ROOT/'source/css/jinkai-font.css').write_text('\n'.join(rules)+'\n')
print(json.dumps({'original':SOURCE.stat().st_size,'base':sizes['base'],'shards':len(groups),'total':sum(sizes.values()),'characters':len(coverage),'coverage':'complete'},indent=2))
