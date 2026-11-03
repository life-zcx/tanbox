"""Compare Cloudflare IPv4/IPv6 and optional origin with TLS verification enabled."""
import argparse
import datetime
import json
import shutil
import subprocess
import uuid

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--host", default="tanbox.kz")
parser.add_argument("--origin", help="Optional origin IP; curl preserves the hostname and certificate verification")
parser.add_argument("--samples", type=int, default=5)
parser.add_argument("--timeout", type=int, default=10)
args = parser.parse_args()
curl = shutil.which("curl.exe") or shutil.which("curl")
if not curl:
    parser.error("curl is required")
if not 1 <= args.samples <= 20 or not 1 <= args.timeout <= 60:
    parser.error("samples must be 1..20 and timeout 1..60")
if "/" in args.host or ":" in args.host or not args.host:
    parser.error("host must be a DNS hostname")
modes = [("cloudflare-v4", ["-4"]), ("cloudflare-v6", ["-6"])]
if args.origin:
    import ipaddress
    address = ipaddress.ip_address(args.origin)
    address_text = f"[{address}]" if address.version == 6 else str(address)
    modes.append(("origin", ["--resolve", f"{args.host}:443:{address_text}"]))
results = []
for sample in range(args.samples):
    for mode, options in modes:
        request_id = "tanbox-audit-" + uuid.uuid4().hex
        command = [curl, "--noproxy", "*", "-sS", "-o", "NUL" if __import__("os").name == "nt" else "/dev/null",
                   "--connect-timeout", str(min(args.timeout, 5)), "--max-time", str(args.timeout),
                   "-H", "X-Audit-Id: " + request_id, "-w", "%{json}", *options,
                   f"https://{args.host}/?audit={request_id}"]
        process = subprocess.run(command, capture_output=True, text=True)
        try:
            data = json.loads(process.stdout)
        except json.JSONDecodeError:
            data = {"exitcode": process.returncode, "errormsg": process.stderr.strip()}
        record = {"mode": mode, "sample": sample + 1, "request_id": request_id,
                  "utc": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                  **{key: data.get(key) for key in ["remote_ip", "http_code", "http_version", "time_namelookup",
                     "time_connect", "time_appconnect", "time_starttransfer", "time_total", "exitcode", "errormsg"]}}
        results.append(record)
        print(json.dumps(record), flush=True)
print(json.dumps({"summary": {mode: {
    "requests": len([r for r in results if r["mode"] == mode]),
    "successful": len([r for r in results if r["mode"] == mode and r["http_code"] == 200 and not r["exitcode"]]),
} for mode, _ in modes}}))
