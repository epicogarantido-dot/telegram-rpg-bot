import json, re, subprocess, html, sys
BASE = "https://openstax.org/apps/archive/20260604.144757/contents/4e09771f-a8aa-40ce-9063-aa58cc24e77f@9d3b8c4:"
SEC = {
 "6.4": "d22c5d70-9ec0-40e3-a0df-daafc65b7dda", "8.2": "ecd146ec-cc57-4c6c-81b4-6d3a057c1ed7",
 "8.3": "f7252c76-e5e4-453a-a626-ed9c74021752", "8.4": "497ed6f4-ac31-4339-85f0-0b220e9d14e2",
 "8.6": "95ff1e22-3a3f-4e23-9d2e-dfc320d45955", "9.7": "92856adf-f3f5-4246-9005-d95044fbfb0e",
 "8.8": "9b18678e-9f17-4709-89c3-f3ac338f3309",
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
