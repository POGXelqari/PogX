# Connecting PogX to pogx.net via Cloudflare Tunnels

Cloudflare Tunnels (part of Cloudflare Zero Trust) allow you to expose your PogX waitlist app on **https://pogx.net** and **https://www.pogx.net** securely **without opening any inbound ports** on your VPS or firewall.

---

## Method 1: Cloudflare Zero Trust Dashboard (Recommended — Quickest & Easiest)

### Step 1: Create Tunnel in Cloudflare
1. Open the [Cloudflare Zero Trust Dashboard](https://one.dash.cloudflare.com/).
2. In the left sidebar, navigate to **Networks** → **Tunnels**.
3. Click **Add a tunnel**, select **Cloudflared**, and click **Next**.
4. Name the tunnel (e.g. `pogx-production`) and click **Save tunnel**.

---

### Step 2: Install the Connector on your Ubuntu VPS
Under **Choose your environment**, select **Debian 64-bit** (Ubuntu). Cloudflare will provide a one-line command containing your unique token.

Example command:
```bash
curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb && dpkg -i cloudflared.deb && cloudflared service install <YOUR_TUNNEL_TOKEN>
```

Paste this command into your Spaceship web terminal (`root@pogxubuntu-streamer-battlevsbattle:~#`).

Once executed:
- `cloudflared` is installed as a background systemd service.
- The tunnel status in Cloudflare will show **HEALTHY / ACTIVE**.

---

### Step 3: Route pogx.net to your Local App
In the Cloudflare dashboard under the **Public Hostnames** tab of your tunnel:

#### 1. Root Domain (`pogx.net`):
- **Subdomain**: *(leave blank)*
- **Domain**: `pogx.net`
- **Path**: *(leave blank)*
- **Type**: `HTTP`
- **URL**: `localhost:3000` (or `127.0.0.1:3000`)
- Click **Save Hostname**.

#### 2. WWW Subdomain (`www.pogx.net`):
- **Subdomain**: `www`
- **Domain**: `pogx.net`
- **Type**: `HTTP`
- **URL**: `localhost:3000`
- Click **Save Hostname**.

Cloudflare will automatically manage the CNAME DNS records for you.

---

## Method 2: Running with Docker / Hyperlift

If deploying via Docker or Hyperlift with Docker Compose:

1. Add your Cloudflare Tunnel token to your environment variables:
   ```env
   TUNNEL_TOKEN=eyJhIjoi...
   ```
2. Start the services:
   ```bash
   docker compose up -d
   ```
   Both the `pogx` container and `cloudflared` tunnel will run concurrently.

---

## Verification
Open your browser and navigate to:
- **https://pogx.net**
- **https://www.pogx.net**

Traffic will be encrypted with Cloudflare's SSL certificate and protected by Cloudflare DDoS mitigation.
