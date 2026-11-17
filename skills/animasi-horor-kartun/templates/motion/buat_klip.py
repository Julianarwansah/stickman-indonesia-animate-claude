"""Klip motion-graphics horor dengan mesin motion-broll (github.com/Barty-Bart/motion-graphics, MIT).

    python buat_klip.py <folder_ep> <spek_klip.py> --remo <proyek Remotion> --video <nama folder video>   # build + render + salin
    python buat_klip.py <folder_ep> <spek_klip.py> --html                                                  # hanya HTML (cek beats.js)
    tambah --potret untuk Shorts/Reels/TikTok (1080x1920)

Dijalankan dari folder <proyek>/motion (berisi engine/, node_modules/ dengan playwright). Durasi tiap klip = panjang
shot scene-nya di <folder_ep>/timeline.json. <spek_klip.py> (contoh: examples/ep1/klip_ep1.py) mengisi CLIPS = {scene: klip}
dengan fungsi di bawah: judul(), bab(), ponsel(), telp911(), berita(); dan waktu: dur(scene), local(id, frac), at_word(id, kata).
Hasil: <remo>/public/<video>/mg/*.mp4 dan <remo>/src/videos/<video>/mg.json (scene -> file) yang dibaca Bridge.tsx.
Gaya: hitam pekat, kartu arang, teks putih tulang, satu aksen merah #c8323a, tanpa kursor.
"""
import argparse
import json
import os
import shutil
import subprocess
import sys

HERE = os.getcwd()
FPS = 30
ap = argparse.ArgumentParser()
ap.add_argument("ep")
ap.add_argument("spek")
ap.add_argument("--remo", default=r"C:\Users\pc\Videos\animasi\kartun-3d-shorts")
ap.add_argument("--video", default="horor_ep1")
ap.add_argument("--html", action="store_true")
ap.add_argument("--potret", action="store_true", help="1080x1920 untuk Shorts/Reels/TikTok")
A = ap.parse_args()
# ukuran bingkai; di potret kartu lebar diperkecil (kamera) supaya muat lebar 1080, ponsel diperbesar mengisi layar
FW, FH = (1080, 1920) if A.potret else (1920, 1080)
KW, KP = (0.62, 1.55) if A.potret else (1.0, 1.0)

tl = json.load(open(os.path.join(A.ep, "timeline.json"), encoding="utf-8"))
L = tl["baris"]
shots = []
for l in L:
    if shots and shots[-1]["scene"] == l["scene"]:
        continue
    shots.append({"scene": l["scene"], "a": l["start"] if shots else 0})
for i, s in enumerate(shots):
    s["b"] = shots[i + 1]["a"] if i + 1 < len(shots) else tl["total"]


def dur(scene):
    return round(sum((s["b"] - s["a"]) for s in shots if s["scene"] == scene) / FPS, 3)


def line(id_):
    return next(l for l in L if l["id"] == id_)


def local(id_, frac=0.0):
    """detik di dalam klip scene-nya untuk posisi frac (0..1) di baris id_"""
    l = line(id_)
    s = next(s for s in shots if s["scene"] == l["scene"])
    return round((l["start"] + frac * (l["end"] - l["start"]) - s["a"]) / FPS, 3)


def at_word(id_, kata):
    t = line(id_)["text"]
    return local(id_, t.index(kata) / len(t))


BG, CARD = "'#07080c'", "'#101117'"
STYLE = """<style>
.w{color:#f2efe8;white-space:nowrap}.g{color:#8a8d99;white-space:nowrap}.r{color:#c8323a;white-space:nowrap}
.bub{position:absolute;left:-250px;width:max-content;max-width:430px;padding:16px 24px;border-radius:28px;background:#24262f;color:#f2efe8;font-size:32px;line-height:42px;white-space:normal}
.bub.red{background:#5c1519;color:#ffd9d9;font-weight:700}
</style>"""


def judul(scene, besar, sub, kecil="A MAPLE HOLLOW STORY"):
    """kartu judul: pil kecil -> kartu besar, senyum merah berjahit tergambar pelan"""
    return (scene, dur(scene), STYLE + f"""
<div data-slot="shape">
  <div class="L" id="Lpill"><div class="row g" style="transform:translate(-50%,-50%);font-size:26px;font-weight:600;letter-spacing:.22em">{kecil}</div></div>
  <div class="L" id="Lt">
    <div class="a w" style="left:-600px;top:-132px;width:1200px;text-align:center;font-size:122px;line-height:124px;font-weight:800;letter-spacing:-.02em">{besar}</div>
    <div class="a r" style="left:-600px;top:8px;width:1200px;text-align:center;font-size:40px;font-weight:700;letter-spacing:.46em">{sub}</div>
    <svg class="a" style="left:-280px;top:78px;overflow:visible" width="560" height="120">
      <path id="smile" d="M10,14 Q280,128 550,14" fill="none" stroke="#c8323a" stroke-width="9" stroke-linecap="round" stroke-dasharray="700" stroke-dashoffset="700"/>
      <g id="st" stroke="#5c1519" stroke-width="5" stroke-linecap="round" opacity="0"></g>
    </svg>
  </div>
</div><!--/shape-->
<script>
const T=__T__, $=id=>document.getElementById(id);
const P=(u)=>{{const x=10+540*u, y=14+2*(1-u)*u*114; return [x,y];}};
let h=''; for(let i=1;i<10;i++){{const [x,y]=P(i/10); h+=`<line x1="${{x}}" y1="${{y-14}}" x2="${{x}}" y2="${{y+14}}"/>`;}} $('st').innerHTML=h;
M.scene({{W:__FW__,H:__FH__,bg:__BG__,T,intro:0.12,
  SH:{{pill:{{w:560,h:84,r:42,bg:__CARD__,cam:1.7}},t:{{w:1360,h:430,r:44,bg:__CARD__,cam:__K115__}}}},
  start:'pill',SEQ:[[1.05,'t']],
  layers:[{{el:'Lpill',tin:0.12,tout:1.05}},{{el:'Lt',tin:1.05,tout:null,update:(t)=>{{
    const k=M.eo(M.clamp((t-1.7)/1.3)); $('smile').setAttribute('stroke-dashoffset',String(700*(1-k)));
    $('st').setAttribute('opacity',String(M.clamp((t-2.9)/0.4)));}}}}]}});
</script>""")


def bab(scene, n, judul_bab, lokasi="MAPLE HOLLOW, VERMONT"):
    """kartu bab: pil "CHAPTER n" -> kartu nomor merah besar + judul"""
    w = max(980, int(2 * (-170 + 0.68 * 58 * len(judul_bab) + 70)))
    return (scene, dur(scene), STYLE + f"""
<div data-slot="shape">
  <div class="L" id="Lp"><div class="row g" style="transform:translate(-50%,-50%);font-size:30px;font-weight:600;letter-spacing:.24em">CHAPTER {n}</div></div>
  <div class="L" id="Lc">
    <div class="a r" style="left:-420px;top:-92px;font-size:156px;line-height:156px;font-weight:800;letter-spacing:-.05em">{n:02d}</div>
    <div class="a w" style="left:-170px;top:-58px;font-size:58px;font-weight:700;letter-spacing:.02em">{judul_bab}</div>
    <div class="a g" style="left:-168px;top:20px;font-size:26px;letter-spacing:.12em">{lokasi}</div>
  </div>
</div><!--/shape-->
<script>
M.scene({{W:__FW__,H:__FH__,bg:__BG__,T:__T__,intro:0.08,
  SH:{{p:{{w:360,h:88,r:44,bg:__CARD__,cam:1.8}},c:{{w:{w},h:300,r:44,bg:__CARD__,cam:__K13__}}}},
  start:'p',SEQ:[[0.9,'c']],
  layers:[{{el:'Lp',tin:0.08,tout:0.9,o:{{din:0.03}}}},{{el:'Lc',tin:0.9,tout:null}}]}});
</script>""")


def ponsel(scene, pengirim, jam, gelembung, mengetik=None, getar=0.15):
    """layar ponsel: gelembung = [(detik, teks, merah?)], mengetik = (mulai, selesai) titik-titik, getar = detik ponsel bergetar"""
    rows, js, y = [], [], 170
    for i, (t, text, red) in enumerate(gelembung):
        h = 42 * (-(-len(text) // 23)) + 32
        rows.append(f'<div class="bub{" red" if red else ""}" id="b{i}" style="top:{y}px">{text}</div>')
        js.append(f"[{t},'b{i}']")
        y += h + 18
    typ = f"const TY=[{mengetik[0]},{mengetik[1]}];" if mengetik else "const TY=[-1,-1];"
    return (scene, dur(scene), STYLE + f"""
<div data-slot="shape">
  <div class="L" id="Lph">
    <div class="a" style="left:-60px;top:22px;width:120px;height:10px;border-radius:5px;background:#24262f"></div>
    <div class="a" style="left:-36px;top:54px;width:72px;height:72px;border-radius:36px;background:#2b2d38;color:#f2efe8;font-size:34px;font-weight:700;display:flex;align-items:center;justify-content:center">{pengirim[0]}</div>
    <div class="a w" style="left:-200px;top:134px;width:400px;text-align:center;font-size:26px;font-weight:600">{pengirim}</div>
    <div class="a g" style="left:-200px;top:166px;width:400px;text-align:center;font-size:18px">{jam}</div>
    <div class="a" id="msgs" style="left:0;top:40px">{''.join(rows)}</div>
    <div class="a" id="typ" style="left:-230px;top:{y + 40}px;padding:18px 24px;border-radius:26px;background:#24262f;display:flex;gap:10px"><i id="d0" style="width:12px;height:12px;border-radius:6px;background:#8a8d99"></i><i id="d1" style="width:12px;height:12px;border-radius:6px;background:#8a8d99"></i><i id="d2" style="width:12px;height:12px;border-radius:6px;background:#8a8d99"></i></div>
  </div>
</div><!--/shape-->
<script>
const $=id=>document.getElementById(id), B=[{','.join(js)}]; {typ}
M.scene({{W:__FW__,H:__FH__,bg:__BG__,T:__T__,intro:0.1,
  SH:{{ph:{{w:560,h:960,r:66,bg:'#0d0e13',cam:__KP__}}}},start:'ph',SEQ:[],
  geom:(t,g)=>{{ const k=t>{getar}&&t<{getar}+0.7?Math.sin(t*90)*9*(1-(t-{getar})/0.7):0; g.cx=(g.cx||0)+k; return g; }},
  layers:[{{el:'Lph',tin:0.1,tout:null,anchor:'t',update:(t)=>{{
    for(const [tb,id] of B) M.apply($(id),M.vis(t,tb,null,{{din:0,lin:0.22}}));
    const ty=t>TY[0]&&t<TY[1]; $('typ').style.opacity=ty?1:0;
    for(let i=0;i<3;i++) $('d'+i).style.transform=`translateY(${{ty?-6*Math.max(0,Math.sin(t*9-i*0.9)):0}}px)`;
  }}}}]}});
</script>""")


def telp911(scene):
    """layar panggilan 911: timer berjalan, gelombang suara merah, tombol END. Kalau scene muncul di beberapa shot,
    Bridge.tsx melanjutkan klip dari posisi terakhir (timer tidak mengulang)."""
    return (scene, dur(scene), STYLE + """
<div data-slot="shape">
  <div class="L" id="Lc">
    <div class="a g" style="left:-200px;top:70px;width:400px;text-align:center;font-size:22px;letter-spacing:.2em">EMERGENCY CALL</div>
    <div class="a w" style="left:-200px;top:110px;width:400px;text-align:center;font-size:120px;font-weight:800;letter-spacing:-.03em">911</div>
    <div class="a g mono" id="tm" style="left:-200px;top:262px;width:400px;text-align:center;font-size:30px">00:00</div>
    <div class="a" id="wv" style="left:-160px;top:370px;width:320px;height:120px"></div>
    <div class="a" style="left:-56px;top:700px;width:112px;height:112px;border-radius:56px;background:#c8323a"></div>
    <div class="a w" style="left:-56px;top:735px;width:112px;text-align:center;font-size:30px;font-weight:700">END</div>
  </div>
</div><!--/shape-->
<script>
const $=id=>document.getElementById(id); let h=''; for(let i=0;i<16;i++) h+=`<div id="w${i}" style="position:absolute;left:${i*20}px;width:12px;border-radius:6px;background:#c8323a"></div>`; $('wv').innerHTML=h;
M.scene({W:__FW__,H:__FH__,bg:__BG__,T:__T__,intro:0.1,
  SH:{c:{w:560,h:960,r:66,bg:'#0d0e13',cam:__KP__}},start:'c',SEQ:[],
  layers:[{el:'Lc',tin:0.1,tout:null,anchor:'t',update:(t)=>{
    const s=Math.floor(t+3); M.setText($('tm'),'00:'+String(s).padStart(2,'0'));
    for(let i=0;i<16;i++){const v=0.25+0.75*Math.abs(Math.sin(t*7.3+i*1.7)*Math.sin(t*3.1+i)); const e=$('w'+i); e.style.height=(10+100*v)+'px'; e.style.top=(60-(5+50*v))+'px';}
  }}]});
</script>""")


def berita(scene, tempat_jam, judul_berita, isi, ticker):
    """kartu berita BREAKING: pil -> kartu, teks berjalan merah di bawah"""
    tick = " · ".join(ticker * 3)
    return (scene, dur(scene), STYLE + f"""
<div data-slot="shape">
  <div class="L" id="Lp"><div class="row w" style="transform:translate(-50%,-50%);font-size:30px;font-weight:800;letter-spacing:.2em"><span class="r" style="font-size:34px">●</span>&nbsp;BREAKING</div></div>
  <div class="L" id="Lc">
    <div class="a" style="left:-640px;top:0;width:200px;height:56px;background:#c8323a;border-radius:0 0 18px 0"></div>
    <div class="a w" style="left:-622px;top:10px;font-size:26px;font-weight:800;letter-spacing:.16em">BREAKING</div>
    <div class="a g" style="left:-600px;top:96px;font-size:24px;letter-spacing:.14em">{tempat_jam}</div>
    <div class="a w" style="left:-600px;top:140px;width:1200px;font-size:60px;line-height:70px;font-weight:800;white-space:normal">{judul_berita}</div>
    <div class="a g" style="left:-600px;top:300px;width:1200px;font-size:30px;white-space:normal">{isi}</div>
    <div class="a" style="left:-640px;top:404px;width:1280px;height:56px;background:#1a1b22"></div>
    <div class="a r" id="tick" style="left:-600px;top:416px;font-size:26px;font-weight:700;letter-spacing:.12em">{tick}</div>
  </div>
</div><!--/shape-->
<script>
M.scene({{W:__FW__,H:__FH__,bg:__BG__,T:__T__,intro:0.08,
  SH:{{p:{{w:380,h:90,r:45,bg:__CARD__,cam:1.8}},c:{{w:1280,h:460,r:30,bg:__CARD__,cam:__K125__}}}},
  start:'p',SEQ:[[0.85,'c']],
  layers:[{{el:'Lp',tin:0.08,tout:0.85}},{{el:'Lc',tin:0.85,tout:null,anchor:'t',update:(t)=>{{document.getElementById('tick').style.transform=`translateX(${{-60*t}}px)`;}}}}]}});
</script>""")


ns = dict(judul=judul, bab=bab, ponsel=ponsel, telp911=telp911, berita=berita, dur=dur, local=local, at_word=at_word, line=line, CLIPS={})
exec(compile(open(A.spek, encoding="utf-8").read(), A.spek, "exec"), ns)
CLIPS = ns["CLIPS"]

clips_dir, dist, out = os.path.join(HERE, "clips"), os.path.join(HERE, "dist"), os.path.join(HERE, "out")
for d in (clips_dir, dist, out):
    os.makedirs(d, exist_ok=True)
files = []
for scene, (name, T, html) in CLIPS.items():
    html = (html.replace("__T__", f"{T:.3f}").replace("__BG__", BG).replace("__CARD__", CARD).replace("__FW__", str(FW)).replace("__FH__", str(FH))
            .replace("__K115__", f"{1.15 * KW:.3f}").replace("__K13__", f"{1.3 * KW:.3f}").replace("__K125__", f"{1.25 * KW:.3f}").replace("__KP__", f"{KP:.3f}"))
    open(os.path.join(clips_dir, f"{name}.html"), "w", encoding="utf-8").write(html)
    files.append((scene, name, T))
    print(f"{name}: {T:.2f}s")
subprocess.run([sys.executable, os.path.join(HERE, "engine", "build.py"), dist] + [os.path.join(clips_dir, f"{n}.html") for _, n, _ in files], check=True)
if A.html:
    sys.exit(0)
env = dict(os.environ, NODE_PATH=os.path.join(HERE, "node_modules"))
pub = os.path.join(A.remo, "public", A.video, "mg")
os.makedirs(pub, exist_ok=True)
mg = {}
for scene, name, T in files:
    mp4 = os.path.join(out, f"{name}.mp4")
    subprocess.run(["node", os.path.join(HERE, "engine", "render.js"), os.path.join(dist, f"{name}.html"), mp4, "30"], check=True, env=env)  # render.js membaca W/H dari M.scene
    shutil.copy(mp4, os.path.join(pub, f"{name}.mp4"))
    mg[scene] = f"{A.video}/mg/{name}.mp4"
    print("render", name, flush=True)
json.dump(mg, open(os.path.join(A.remo, "src", "videos", A.video, "mg.json"), "w"), indent=1)
