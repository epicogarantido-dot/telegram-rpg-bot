import json, re, subprocess, html, sys
BASE = "https://openstax.org/apps/archive/20260604.144757/contents/4e09771f-a8aa-40ce-9063-aa58cc24e77f@9d3b8c4:"
SEC = {
 "11.1": "62d8eef5-d169-4da5-aa71-58f4a016cd62", "11.4": "fcf8e6e4-12ce-4a5c-86e1-935fca2e329a",
 "11.5": "c19ef75c-5336-4187-aba1-23d3db08be8f", "11.7": "23bf79d7-4dff-4d0e-b04c-b0430658f0c7",
 "11.9": "e8320f93-819d-491d-b06e-1601875b789d", "12.5": "57339703-c590-4425-bd71-e3e79733f74d",
 "12.6": "c769a8f4-45dd-47b2-a925-128b1808fe02", "12.7": "2a1b4d2f-7c8b-48a3-943a-e454a304f2b3",
 "12.8": "a54263fc-a079-4a4e-91d5-7182a949769e", "12.9": "52e2f73d-f0a0-496a-9d13-4a803e858535",
 "12.10": "71e6298f-5dd3-44e3-8e27-e614ff5cf1f9", "14.1": "a48b5af1-425a-4762-90c3-29a8c07429cd",
 "14.5": "7787e4dd-9b59-42f0-be9e-ab9d0e570440", "14.6": "b75f233d-7677-4153-8a41-fe6e575fc2f4",
 "5.5": "4bfacf57-147b-4674-9fce-f24bd3887b5b",
}
def texto(h):
    h = re.sub(r'<(script|style)[^>]*>.*?</\1>', '', h, flags=re.S)
    h = re.sub(r'<(h[1-6])[^>]*>', '\n\n### ', h); h = re.sub(r'</h[1-6]>', '\n', h)
    h = re.sub(r'<li[^>]*>', '\n- ', h); h = re.sub(r'<(p|div|tr|figure|table)[^>]*>', '\n', h)
    h = re.sub(r'<[^>]+>', '', h); h = html.unescape(h)
    return re.sub(r'\n\s*\n+', '\n\n', re.sub(r'[ \t]+', ' ', h)).strip()
for n, i in SEC.items():
    j = json.loads(subprocess.check_output(["curl", "-s", "--max-time", "30", BASE + i + ".json"]))
    t = texto(j["content"])
    open(f"sec-{n}.txt", "w").write(f"# {re.sub('<[^>]+>','',j['title'])}\nslug: {j.get('slug','')}\n\n{t}")
    print(n, len(t.split()), "palavras |", re.sub('<[^>]+>','',j['title'])[:60], "|", j.get('slug',''))
