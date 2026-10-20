# Server setup — UrConnections (Stage 14)

> **Runbook and learning notes.** Every step done on the production server, with the exact commands and *why* each one exists.
> Use it to understand the setup, and to rebuild the server from scratch (OVH can reinstall the VPS at any time).
> **Current as of Stage 14, step 8**: the app is live at **https://urconnections.aelshafey.com** (deployed 2026-10-19). Email goes through **Resend** (§9). Steps 10–11 are the plan and get filled in as they are done.

## 0. The big picture

```
Visitor opens https://urconnections.aelshafey.com
   │
   ▼ 1. DNS (Cloudflare): "which IP has this name?"  →  15.235.241.21
   ▼ 2. Internet → the VPS at OVH
   ▼ 3. Firewall (ufw): port 443 allowed?  yes
   ▼ 4. Docker → Caddy (HTTPS) → web / api → postgres / garage      (compose.prod.yml)

The admin (you):  your PC ──SSH, key only──▶ ubuntu@15.235.241.21
```

| Piece | Choice | Why |
|---|---|---|
| Domain | `aelshafey.com`, bought at **Cloudflare Registrar** | Sold at cost (renewal = first-year price). One personal domain for every portfolio project: each project gets a subdomain, so CV links never change. |
| DNS | Cloudflare DNS, record `urconnections` → `15.235.241.21`, **DNS only (grey cloud)** | Simplest start: visitors reach the server directly, Caddy gets its own certificate, and the API sees real client IPs (rate limits). The orange-cloud proxy is a later step (see §11). |
| Server | **OVHcloud VPS-1**: 2 vCore, 4 GB RAM, 40 GB NVMe, unlimited traffic, IPv4 + daily backup + anti-DDoS included | ~$4.50/month. Hetzner's cheap plans were out of stock (Oct 2026). The stack needs ~150 MB RAM, so other projects fit on the same server. |
| OS | **Ubuntu 26.04 LTS** | LTS = about 5 years of security updates. Docker supports it officially. |

---

## 1. Domain and DNS

**Concepts**
- **Registrar**: the company you rent a domain name from, per year. **TLD**: the ending (`.com`). Check the *renewal* price, not the first-year promo.
- **DNS**: the internet's phone book, turning names into IP addresses. An **A record** maps a name to an IPv4 address (an **AAAA record** to IPv6).
- **Subdomain**: `urconnections.aelshafey.com` is a free, unlimited "child" of the domain, created by adding a DNS record.
- **Proxy (orange cloud) vs DNS only (grey cloud)**: proxied, visitors connect to Cloudflare, which forwards to the server. DNS only, visitors connect straight to the server.

**Done**
- Cloudflare → `aelshafey.com` → DNS → Records → Add record: Type `A`, Name `urconnections`, IPv4 `15.235.241.21`, Proxy **off**.
- The "Proxying is required for most security and performance features" banner can be ignored for now.

**Check**
```powershell
nslookup urconnections.aelshafey.com 1.1.1.1   # must answer 15.235.241.21 (Cloudflare IPs would mean the proxy is on)
```

---

## 2. SSH key (on the Windows PC)

**Concepts**
- An SSH key is a **pair**: the **private key** (`id_ed25519`) never leaves the PC; the **public key** (`id_ed25519.pub`) is copied to every server. The server sends a challenge that only the private key can answer, so no secret crosses the network.
- **Ed25519**: the modern key type (short, fast, recommended).
- **Passphrase**: encrypts the private key file, so a stolen copy is useless.
- **ssh-agent**: keeps the unlocked key in memory, so the passphrase is typed once per Windows session.

**Done**
```powershell
ssh-keygen -t ed25519 -C "aelshafey-vps"            # Enter for the default path, then a passphrase
ssh-keygen -p -f $env:USERPROFILE\.ssh\id_ed25519   # (adds/changes the passphrase of an existing key)
```
ssh-agent (once, PowerShell **as Administrator**; it is disabled by default on Windows 10):
```powershell
Get-Service ssh-agent | Set-Service -StartupType Automatic
Start-Service ssh-agent
```
Then in a normal PowerShell: `ssh-add $env:USERPROFILE\.ssh\id_ed25519` → `Identity added`.

> Windows has two SSH clients: `C:\Windows\System32\OpenSSH\ssh.exe` (PowerShell) and Git Bash's own. Only the Windows one talks to the Windows ssh-agent.

---

## 3. First login and the public key

**Concepts**
- **`known_hosts`** (on the PC): the first connection asks "Are you sure you want to continue connecting?". Answering `yes` saves the **server's** key. If it ever changes, SSH warns loudly: someone may be impersonating the server (man-in-the-middle). After an OVH *reinstall* the key changes legitimately; remove the old entry with `ssh-keygen -R 15.235.241.21`.
- **`authorized_keys`** (on the server, `/home/ubuntu/.ssh/`): the list of public keys allowed to log in.
- **Permissions**: SSH ignores `authorized_keys` if others could change it. Folder `700` (`drwx------`), file `600` (`-rw-------`).

**Done**
1. First login with the password from OVH's email: `ssh ubuntu@15.235.241.21`.
2. On the server, write the public key (the text of `id_ed25519.pub`):
   ```bash
   mkdir -p ~/.ssh && chmod 700 ~/.ssh
   echo 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIITJ5Br+fLJB+Qh2kOqBXGUbntKLxeubi6tJKaA3PCZf aelshafey-vps' > ~/.ssh/authorized_keys
   chmod 600 ~/.ssh/authorized_keys
   cat -A ~/.ssh/authorized_keys   # one line, ending in "aelshafey-vps$", nothing before "ssh-ed25519"
   ```

> **Trap found: the BOM.** The usual Windows one-liner `type id_ed25519.pub | ssh ubuntu@IP "cat >> ~/.ssh/authorized_keys"` failed. Windows PowerShell 5.1 added a **BOM** (invisible bytes, shown by `cat -A` as `M-oM-;M-?`) at the start and a Windows line ending (`^M`) at the end, so SSH could not recognise the key type and ignored the line. Writing the line *on the server* with `echo` avoids it. Lesson: invisible encoding differences (BOM, `\r\n` vs `\n`) break Linux config files.

**Check** (from the PC, never asks for a password):
```powershell
ssh -o BatchMode=yes ubuntu@15.235.241.21 "echo KEY-LOGIN-OK"
ssh -v ... 2>&1 | findstr /i "accepts"     # "Server accepts key" = the server knows the key
```

---

## 4. Securing SSH

**Why:** on its first day the server's log already showed **35 failed logins** from bots guessing passwords. Every public server gets them.

**What OVH ships:** password login **on** (`/etc/ssh/sshd_config.d/50-cloud-init.conf` says `PasswordAuthentication yes`), root login with a key, X11 forwarding on, 6 tries per connection.

**How sshd reads its config:** `/etc/ssh/sshd_config` includes `sshd_config.d/*.conf` in **alphabetical order**, and for each setting **the first value read wins**. So a file named `10-…` overrides `50-cloud-init.conf`, even if cloud-init rewrites its own file.

**Done** — `/etc/ssh/sshd_config.d/10-hardening.conf`:
```
PasswordAuthentication no        # keys only
KbdInteractiveAuthentication no  # closes the other password prompt
PermitRootLogin no               # log in as ubuntu, use sudo
X11Forwarding no                 # no graphical apps over SSH
MaxAuthTries 3                   # disconnect after 3 failures (was 6)
AllowUsers ubuntu                # nobody else may log in over SSH
```
```bash
sudo sshd -t                 # syntax check first: a broken config could lock everyone out
sudo systemctl reload ssh    # reload keeps open sessions alive
sudo sshd -T | grep -Ei '^(passwordauthentication|permitrootlogin|allowusers|maxauthtries|x11forwarding) '
```

**Check** (all from the PC, each a *new* connection):
```powershell
ssh -o BatchMode=yes ubuntu@15.235.241.21 true                                              # works
ssh -o PubkeyAuthentication=no -o PreferredAuthentications=password ubuntu@15.235.241.21    # Permission denied (publickey)
ssh root@15.235.241.21                                                                       # Permission denied (publickey)
```

**Emergency exit:** OVH Control Panel → the VPS → **KVM** console works without SSH (lost key, broken config).

> The `ubuntu` user may run `sudo` without a password (OVH default). Acceptable because only the key can log in as `ubuntu`.

---

## 5. Firewall (ufw)

**Concepts**
- A **port** is a numbered door on the server; a program listens behind it (SSH on 22, HTTPS on 443). **TCP** is for normal connections; **UDP** is used by HTTP/3 (QUIC).
- **Default deny**: every incoming connection is refused unless a rule allows it. Outgoing traffic (updates, Docker pulls, email) stays allowed.

**Done** (SSH is allowed *before* enabling, or the firewall would lock us out):
```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp  comment "SSH"
sudo ufw allow 80/tcp  comment "HTTP (Caddy: certificates + redirect)"
sudo ufw allow 443/tcp comment "HTTPS"
sudo ufw allow 443/udp comment "HTTP/3"
sudo ufw --force enable
sudo ufw status verbose
```

| Port | Why open |
|---|---|
| 22/tcp | SSH (admin) |
| 80/tcp | Let's Encrypt checks the domain over HTTP before issuing the certificate; Caddy also redirects `http://` → `https://` |
| 443/tcp | The website (HTTPS) |
| 443/udp | HTTP/3 (`compose.prod.yml` publishes it) |

> **Docker bypasses ufw.** Ports published by Docker (`ports:` in compose) get their own firewall rules and are reachable even without a ufw rule. That is why `compose.prod.yml` publishes ports **only for Caddy** (80/443); postgres, api and garage stay on Docker's private network. Never add `ports:` to those services on the server.

---

## 6. System updates

Already set up by OVH's image: `unattended-upgrades` installs **security updates daily** (`/etc/apt/apt.conf.d/20auto-upgrades`).

It does **not reboot**. Kernel updates only apply after a reboot. Check now and then:
```bash
[ -f /var/run/reboot-required ] && cat /var/run/reboot-required   # "*** System restart required ***"
sudo reboot                                                       # containers come back by themselves (restart: unless-stopped)
```

---

## 7. Docker

**Concepts**
- **apt repository**: a server that `apt` downloads packages from. Docker's own repository is newer than Ubuntu's `docker.io` package, and the daily updates keep it patched.
- **GPG signing key**: `apt` installs a package only if Docker signed it, so a tampered package is rejected.
- **The `docker` group is root-equivalent**: a container can mount any host folder (`-v /:/host`). Whoever can run `docker` can do anything on the server.

**Done** (following [Docker's install guide for Ubuntu](https://docs.docker.com/engine/install/ubuntu/)):
```bash
sudo apt-get update && sudo apt-get install -y ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
sudo tee /etc/apt/sources.list.d/docker.sources <<EOF
Types: deb
URIs: https://download.docker.com/linux/ubuntu
Suites: $(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}")
Components: stable
Architectures: $(dpkg --print-architecture)
Signed-By: /etc/apt/keyrings/docker.asc
EOF
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

Log limits — `/etc/docker/daemon.json` (by default Docker keeps container logs forever and they can fill the disk):
```json
{
  "log-driver": "json-file",
  "log-opts": { "max-size": "10m", "max-file": "3" }
}
```
```bash
sudo systemctl restart docker
sudo usermod -aG docker ubuntu     # docker without sudo; active from the next login
docker run --rm hello-world        # "Hello from Docker!"
```
Installed: Docker 29.9.1, Compose v5.6.0. The limit applies to containers created after the change.

---

## 8. Deploy the app

**1. Code** (public repo, so no deploy key is needed). Until Stage 15 automates deploys, the server follows the current stage branch (first `stage-13-prod-docker`, now `stage-14-vps`: `git fetch && git switch stage-14-vps`). Never copy files to the server by hand: a hand-copied `compose.prod.yml` arrived with Windows line endings (CRLF) and blocked `git switch` ("local changes would be overwritten").
```bash
mkdir -p ~/apps && cd ~/apps
git clone --branch stage-13-prod-docker https://github.com/BoudiHamed/UrConnection.git urconnections
cd urconnections
```

**2. `.env.prod`, created on the server.** The secrets are generated *there* with `openssl` (the OS's secure random generator) and never travel over the network. Node isn't installed on the server, so this replaces `npm run prod:env`:
```bash
umask 077   # new files readable by ubuntu only (-rw-------)
perl -pe 's/__RANDOM_HEX_(\d+)__/my $h=`openssl rand -hex $1`; chomp $h; $h/ge' .env.prod.example > .env.prod
sed -i \
  -e 's|^SITE_ADDRESS=.*|SITE_ADDRESS=urconnections.aelshafey.com|' \
  -e 's|^APP_ORIGIN=.*|APP_ORIGIN=https://urconnections.aelshafey.com|' \
  -e 's|^SMTP_URL=.*|SMTP_URL=smtp://mailpit:1025|' \
  -e 's|^MAIL_FROM=.*|MAIL_FROM=UrConnections <no-reply@aelshafey.com>|' \
  .env.prod
```
Never regenerate `.env.prod` on a running server: the database was created with the old password, and the API would be locked out.

**3. Build and start** (first build ≈ 1–2 minutes):
```bash
docker compose -f compose.prod.yml --env-file .env.prod up -d --build --wait
```
Start order (from `depends_on`): postgres + garage healthy → `migrate` applies the migrations and exits → api + backup start → caddy starts once web and api are healthy.

**4. The certificate.** Caddy asks **Let's Encrypt** for a certificate for `SITE_ADDRESS`. Let's Encrypt checks over **port 80** that the name really leads to this server (the **ACME HTTP-01 challenge**), from several places in the world at once (the log showed 5 `served key authentication` lines), then issues it. Renewal is automatic. If port 80 is closed or DNS points elsewhere, this step fails. Read: [Let's Encrypt — How it works](https://letsencrypt.org/how-it-works/).
```bash
docker logs urconnections-prod-caddy-1 2>&1 | grep -E "certificate obtained|could not get certificate"
```

**Check** (from any computer):
```bash
curl https://urconnections.aelshafey.com/api/health      # {"ok":true,"db":"up"}
curl -I http://urconnections.aelshafey.com/              # 308 → https://
```
Ports 3000, 5432, 3900, 3902, 8025 and 8080 must be closed from outside; only Caddy (80/443) is public.

**HSTS** (Caddyfile, Stage 14): `Strict-Transport-Security: max-age=31536000` on the real domain only. After one HTTPS visit the browser refuses plain HTTP to this host for a year, so a later visit can't be downgraded by someone on the network. Check: `curl -sI https://urconnections.aelshafey.com/ | grep -i strict`.

**Day-to-day** (in `~/apps/urconnections`; `dc` is just shorthand here for `docker compose -f compose.prod.yml --env-file .env.prod`):
```bash
dc ps                       # status of every service
dc logs -f api              # follow one service's logs (Ctrl+C to stop)
dc exec backup sh /backup.sh once    # a database backup right now
git pull && dc up -d --build --wait  # deploy a new version (Stage 15 automates this)
```

## 9. Email — Resend

**Provider: [Resend](https://resend.com/pricing)**, free plan: 3,000 emails/month, **100/day**, 3 domains, SMTP included, logs kept 30 days. When the limit is reached it stops sending (no bill). Chosen (2026-10-19) because the app only sends verification and reset emails (a handful a day), the API's rate limits stop bots from burning the quota, and SMTP means no code change. Backup option if 100/day is ever too little: Brevo (300/day free). SendGrid's free plan ended in May 2025.

**DNS records on `aelshafey.com`** (added in Cloudflare, values copied from Resend → Domains):

| Record | Name | What it does |
|---|---|---|
| TXT (**DKIM**) | `resend._domainkey` | Public key for the signature Resend puts on every email: receivers check the mail really comes from this domain and wasn't changed (same idea as the SSH key) |
| CNAME | `send` → `send.forge.rmta.net` | Points to Resend's records for the bounce address: **SPF** (which servers may send) and **MX** (where bounces go). Resend can change its servers without DNS changes here. |
| TXT (**DMARC**) | `_dmarc` = `v=DMARC1; p=none;` | What receivers do when a mail fails SPF/DKIM (`none` = only report). **TODO: missing (checked 2026-10-20), add it.** |

Mail goes out **from** `no-reply@aelshafey.com`; the technical bounce part uses `send.aelshafey.com`, which keeps the main domain's reputation separate.

**API key**: a key with **sending access only** (if it leaks, it can only send mail). For Resend's SMTP the username is `resend` and the password is the key. It was typed on the server, never shown or sent anywhere else:
```bash
cd ~/apps/urconnections
read -rsp "Resend API key: " KEY; echo      # -s: nothing is shown while typing
sed -i "s|^SMTP_URL=.*|SMTP_URL=smtps://resend:${KEY}@smtp.resend.com:465|" .env.prod; unset KEY
grep -c '^SMTP_URL=smtps://resend:re_' .env.prod   # 1 = OK
```
`smtps://…:465` = TLS from the first byte, so the mail and the key are encrypted on the way. Apply with `dc up -d --wait` (recreates only `api` and `migrate`, the services that read `SMTP_URL`).

**Check the login without sending anything:**
```bash
dc exec -T api node -e 'require("nodemailer").createTransport(process.env.SMTP_URL).verify().then(()=>console.log("OK"),e=>console.log("FAILED",e.message))'
```
Failed sends are logged by the API (`dc logs api | grep "email failed"`) and listed in Resend's dashboard (Emails).

### Before Resend: the Mailpit placeholder (removed)

Until 2026-10-19 a **Mailpit** container caught every email, so nothing reached real users (sign-up still worked: the API logs the mail error and the user can press "resend"). It is kept here as a pattern for testing a server without a mail provider. It was started by hand, outside `compose.prod.yml`:
```bash
docker run -d --name mailpit --restart unless-stopped \
  --network urconnections-prod_default --network-alias mailpit \
  -p 127.0.0.1:8025:8025 axllent/mailpit:v1
```
- `--network ... --network-alias mailpit`: joins the stack's private network under the name `mailpit`, so `SMTP_URL=smtp://mailpit:1025` reaches it.
- `-p 127.0.0.1:8025:8025`: the inbox listens on the server's **localhost only**, so it isn't reachable from the internet (Docker bypasses ufw, so binding to 127.0.0.1 is what protects it).
- Before `docker compose down`, stop it first (`docker rm -f mailpit`): Compose can't remove a network that still has a container attached.

**Reading the inbox: an SSH tunnel.** `-L` forwards a port on your PC through the encrypted SSH connection to a port on the server. `18025` is used locally because the dev Mailpit already uses 8025 on the PC:
```powershell
ssh -N -L 18025:127.0.0.1:8025 ubuntu@15.235.241.21    # leave it running; Ctrl+C closes the tunnel
```
Then open http://localhost:18025 on the PC.

Removed with `docker rm -f mailpit && docker image rm axllent/mailpit:v1` once Resend worked.

**Google sign-in** (optional, also open): create OAuth credentials with the redirect URI `https://urconnections.aelshafey.com/api/auth/google/callback`, then fill `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` in `.env.prod`.

## 10. Backups and monitoring

A backup that only lives on the same server dies with it (OVH's Strasbourg data center burned down in 2021). So there are two layers:

| Layer | Where | How often | Kept |
|---|---|---|---|
| `backup` service (`docker/backup/backup.sh`) | `backups` volume on the server | every 24 h (+ `dc exec backup sh /backup.sh once`) | 14 days (`BACKUP_KEEP_DAYS`) |
| `offsite` service (`docker/backup/offsite.sh`) | **Cloudflare R2** bucket `urconnections-backups` | every 6 h, only new files | 30 days (`OFFSITE_KEEP_DAYS`) |

**R2 setup (2026-10-20):** Cloudflare → R2 → bucket `urconnections-backups` (private). Key: *Account API token* with **Object Read & Write on this bucket only**, so a stolen key can't reach anything else in the account. The five `OFFSITE_*` values plus `COMPOSE_PROFILES=offsite` go at the end of `.env.prod` on the server (the profile is what makes Compose start `offsite`; without it the service is skipped, which keeps `npm run prod:up` on the PC working without a bucket). Check without showing the secrets:
```bash
awk -F= '/^(OFFSITE_|COMPOSE_PROFILES)/ {print $1, (length($2) ? "set" : "EMPTY")}' .env.prod
dc exec offsite sh /offsite.sh once     # → "offsite: copied to r2:urconnections-backups (N dumps there)"
```
rclone's `Config file ... not found` notice is expected: the remote is built from `RCLONE_CONFIG_R2_*` variables instead of a file.

**Restore drill (done 2026-10-20, passed).** Always restore **from R2**, the copy you'd depend on if the server were gone, into a scratch database so the live site isn't touched:
```bash
FILE=$(dc exec -T offsite rclone lsf r2:urconnections-backups --include 'urconnections-*.dump' 2>/dev/null | sort | tail -1)
dc exec -T postgres createdb -U urconnections restore_test
dc exec -T offsite rclone cat "r2:urconnections-backups/$FILE" 2>/dev/null \
  | dc exec -T postgres pg_restore -U urconnections -d restore_test --no-owner --exit-on-error
for db in urconnections restore_test; do
  dc exec -T postgres psql -U urconnections -d $db -tAc "select '$db', (select count(*) from users), (select count(*) from groups), (select count(*) from kysely_migration)" </dev/null
done
dc exec -T postgres dropdb -U urconnections restore_test
```
The pipe streams the dump from one container into the other without a temporary file. Both lines matched (users, groups, sessions, migrations, the `citext` extension, triggers). For a **real** restore onto a new server: deploy the stack, stop `api`, then `pg_restore --clean --if-exists -d urconnections` instead of the scratch database.

> **Trap found:** inside a script fed to `bash -s` (or a `while read` loop), `docker exec -T` reads the rest of the script from stdin and swallows it: the commands after it silently never run. `</dev/null` on the `exec` line prevents it.

**Uptime monitoring**: a free service (UptimeRobot, Better Stack) calls `https://urconnections.aelshafey.com/api/health` every few minutes and emails when it fails. The endpoint also checks the database, so "up" means the whole chain (DNS → Caddy → API → Postgres) works.

## 11. Later: Cloudflare proxy (orange cloud)

Gives caching, stronger DDoS protection and hides the server IP. Before turning it on:
- Cloudflare SSL/TLS mode **Full (strict)** (Cloudflare ↔ server stays encrypted and verified).
- The API would see Cloudflare's IP instead of the visitor's. Caddy (`trusted_proxies` with Cloudflare's ranges) and Express (`trust proxy`) must be adjusted, or the per-IP rate limits stop working.

---

## Learning resources

| Topic | Resource |
|---|---|
| Shell, SSH, command-line tools | [The Missing Semester of Your CS Education (MIT)](https://missing.csail.mit.edu/) |
| Linux practice as a game | [OverTheWire: Bandit](https://overthewire.org/wargames/bandit/) |
| Linux reference (free book) | [The Linux Command Line](https://linuxcommand.org/tlcl.php) |
| DNS, HTTPS/TLS, CDN, DDoS | [Cloudflare Learning Center](https://www.cloudflare.com/learning/) |
| Networking and Linux as comics | [Julia Evans' zines](https://wizardzines.com/) |
| Server setup tutorials (any provider) | [DigitalOcean Community Tutorials](https://www.digitalocean.com/community/tutorials): "Initial Server Setup with Ubuntu", "SSH Essentials", "UFW Essentials" |
| Docker | [Docker: Get started](https://docs.docker.com/get-started/) |
| Certificates | [Let's Encrypt — How it works](https://letsencrypt.org/how-it-works/) |
| What to learn next | [roadmap.sh — Backend](https://roadmap.sh/backend), [roadmap.sh — DevOps](https://roadmap.sh/devops) |

**Where this sits:** everything above is **basic backend / full-stack knowledge** (Linux, SSH, DNS, ports, HTTPS, Docker, deploying). DevOps adds CI/CD (Stage 15), monitoring, backups and automation (Ansible, Terraform). Cloud engineering adds a provider's services (AWS/GCP/Azure, IAM, VPCs, Kubernetes).

**How to make it stick:** read a concept, then look at it on the server; rebuild the server once from this file without help (OVH → Reinstall); write each concept in 2–3 sentences of your own; break something on purpose and fix it (e.g. close port 80 and watch a certificate renewal fail).
