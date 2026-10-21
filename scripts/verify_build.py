"""Validate generated production HTML/XML without a browser or network."""
import json
from pathlib import Path
from urllib.parse import urlparse
from xml.etree import ElementTree
from bs4 import BeautifulSoup

BUILD = Path('.next/server/app')
pages = [p for p in BUILD.rglob('*.html') if not p.name.startswith('_')]
assert pages, 'Run npm run build first'
for path in pages:
    soup = BeautifulSoup(path.read_text(), 'html.parser')
    assert len(soup.find_all('main')) == 1, f'{path}: expected one main landmark'
    assert len(soup.find_all('h1')) == 1, f'{path}: expected one H1'
    assert soup.html.get('lang') == 'en', f'{path}: missing page language'
    assert soup.find('meta', attrs={'name': 'description'}), f'{path}: missing description'
    canonical = soup.find('link', rel='canonical')
    assert canonical and urlparse(canonical['href']).netloc == 'www.devjobs.site', f'{path}: invalid canonical'
    assert soup.find('meta', attrs={'property': 'og:image'})['content'] == 'https://www.devjobs.site/og-image.png'
    ids = [tag['id'] for tag in soup.find_all(id=True)]
    assert len(ids) == len(set(ids)), f'{path}: duplicate element IDs'
    for script in soup.find_all('script', attrs={'type': 'application/ld+json'}):
        assert json.loads(script.string), f'{path}: invalid structured data'
    for link in soup.find_all('a', target='_blank'):
        assert 'noopener' in link.get('rel', []), f'{path}: unsafe external link'
    for button in soup.find_all('button'):
        assert button.get('aria-label') or button.get_text(strip=True), f'{path}: unnamed button'
    for field in soup.find_all(['input', 'select']):
        assert field.get('aria-label') or field.find_parent('label') or (field.get('id') and soup.find('label', attrs={'for': field['id']})), f'{path}: unnamed input'

home = BeautifulSoup((BUILD / 'index.html').read_text(), 'html.parser')
assert len(home.select('.job-card')) == 12, 'Home must serve real listings before JavaScript'
assert len(home.select('.faq-section details')) == 5
for name in ['saved', 'matches']:
    soup = BeautifulSoup((BUILD / f'{name}.html').read_text(), 'html.parser')
    assert 'noindex' in soup.find('meta', attrs={'name': 'robots'})['content']

sitemap = ElementTree.fromstring((BUILD / 'sitemap.xml.body').read_text())
urls = [element.text for element in sitemap.iter('{http://www.sitemaps.org/schemas/sitemap/0.9}loc')]
assert len(urls) == len(set(urls)), 'Duplicate sitemap URLs'
assert 'https://www.devjobs.site/jobs' in urls
assert not any(url.endswith(('/saved', '/matches')) for url in urls)
feed = ElementTree.fromstring((BUILD / 'feed.xml.body').read_text())
assert 0 < len(feed.findall('./channel/item')) <= 100
assert Path('public/og-image.png').is_file()
assert Path('public/favicon.svg').is_file()
print(f'PASS: {len(pages)} generated pages; {len(urls)} sitemap URLs; valid RSS; metadata, semantics, labels, and assets.')
