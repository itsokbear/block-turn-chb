"""Render the cell-native Brunya polygons into reproducible, mask-safe PWA icons.
Only Python's standard library is required; public/favicon.svg uses the same art.
"""
import re, struct, zlib
from pathlib import Path
root = Path(__file__).resolve().parent.parent
source = (root / 'app/bruni-art.tsx').read_text().split('export function BruniTail')[0]
paths = re.findall(r'<path fill="(#[a-fA-F0-9]+)" d="([^"]+)"', source)
polygons = []
for fill, d in paths:
    for part in d.split('M')[1:]:
        nums = [float(n) for n in re.findall(r'-?\d+(?:\.\d+)?', part)]
        polygons.append((tuple(int(fill[i:i+2], 16) for i in (1, 3, 5)), list(zip(nums[::2], nums[1::2]))))
def inside(x, y, points):
    hit = False
    for (a, b), (c, d) in zip(points, points[1:] + points[:1]):
        if (b > y) != (d > y) and x < (c-a)*(y-b)/(d-b)+a:
            hit = not hit
    return hit
svg_paths = ''.join(f'<path fill="{fill}" d="{d}"/>' for fill, d in paths)
(root / 'public/favicon.svg').write_text('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="100" fill="#f4e6cb"/><circle cx="362" cy="157" r="53" fill="#e8b86a"/><path fill="#dbb47c" d="M0 385Q200 325 512 400V512H0Z"/><g transform="translate(176 260) scale(1.6)">'+svg_paths+'</g></svg>\n')
def chunk(kind, data):
    return struct.pack('!I', len(data)) + kind + data + struct.pack('!I', zlib.crc32(kind+data)&0xffffffff)
for size, name in [(192,'icon-192.png'), (512,'icon-512.png'), (180,'apple-touch-icon.png')]:
    # Supersampling avoids jagged edges in the tiny home-screen icon.
    scale = 2
    width = size * scale
    rows = []
    for y in range(size):
        row = bytearray()
        for x in range(size):
            samples = []
            for sy in range(scale):
                for sx in range(scale):
                    px = (x*scale+sx+.5)/width*512; py = (y*scale+sy+.5)/width*512
                    color = (244,230,203)
                    if (px-362)**2+(py-157)**2<53**2: color=(232,184,106)
                    if py > 358 + .00055*(px-190)**2: color=(219,180,124)
                    bx=(px-176)/1.6; by=(py-260)/1.6
                    if 0<=bx<=100 and -86<=by<=100:
                        for fill, points in polygons:
                            if inside(bx,by,points): color=fill
                    samples.append(color)
            row.extend(round(sum(c[i] for c in samples)/len(samples)) for i in range(3))
        rows.append(b'\x00'+row)
    png=b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('!2I5B',size,size,8,2,0,0,0))+chunk(b'IDAT',zlib.compress(b''.join(rows)))+chunk(b'IEND',b'')
    (root/'public'/name).write_bytes(png)
    print(name)
