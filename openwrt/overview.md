# OpenWrt System Overview (Sanitized)

Date of audit: 2026-04-30 (UTC)
Host access method: SSH (`root@192.168.1.1`)

## 1) Platform and Firmware

- Device model: Xiaomi AX3600
- Board: `xiaomi,ax3600`
- OS: OpenWrt 23.05.2 (`r23630-842932a63d`)
- Target: `ipq807x/generic`
- Kernel: `5.15.137`
- Architecture: `aarch64_cortex-a53` (ARMv8), 4 CPU cores
- Root filesystem: `squashfs` + `ubifs` overlay

Hardware/boot highlights from runtime:
- IPQ807x platform with NSS data plane interfaces (`wan`, `lan1`, `lan2`, `lan3`)
- UBI rootfs attached successfully, no bad PEBs reported during boot
- System booted cleanly and networking interfaces were registered normally

## 2) Resources and Storage

- RAM visible to OS: ~417 MB (from total 512 MB class device)
- Swap: disabled (`0`)
- Flash layout:
  - `/rom` (read-only firmware image): full by design
  - `/overlay`: ~175 MB total, low utilization (~6% used at audit time)

Interpretation:
- Storage headroom is good.
- Memory is moderate for this platform and current feature set, but no immediate exhaustion symptoms were observed.

## 3) Network Topology

Logical segments:
- LAN bridge (`br-lan`): `192.168.1.0/24`
- Guest bridge (`br-guest`): `192.168.30.0/24`
- WAN uplink: DHCP-based IPv4 uplink
- VPN interface: `awg0` (AmneziaWG), active

Routing behavior observed:
- Default route via WAN gateway
- Dedicated route to VPN endpoint host pinned via WAN
- Guest subnet routed locally via `br-guest`

IPv6:
- ULA prefix configured on LAN
- IPv6 local routes present
- WAN6 interface exists (DHCPv6 mode), with standard OpenWrt baseline behavior

## 4) Wireless Configuration

Radio state:
- One 5 GHz radio enabled for main SSID
- One 2.4 GHz radio enabled for main SSID
- Additional 2.4 GHz guest SSID enabled and mapped to guest network
- One default radio profile disabled

Guest Wi-Fi isolation:
- Guest SSID is attached to the guest L3 segment
- AP isolation option is enabled on guest interface

Operational note:
- Repeating `hostapd` log messages show a client repeatedly failing to complete authentication on 2.4 GHz. This is often caused by weak signal, incompatible client behavior, or stale credentials on a client device.

## 5) Firewall and Access Control

Zones:
- `lan`: permissive intra-zone behavior (standard trusted zone)
- `wan`: input reject, NAT masquerade enabled
- `vpn`: dedicated zone for `awg0`, masquerade enabled
- `guest`: restricted input/forward rules

Forwardings:
- `lan -> wan`: enabled
- `lan -> vpn`: enabled
- `guest -> wan`: enabled

Guest restrictions:
- Explicit allow for DNS and DHCP from guest clients
- Explicit block for guest access to router admin ports (`22/80/443`)

Port forwards from WAN:
- Multiple DNAT rules to internal hosts are enabled (web and game/service ports)

Security implication:
- Port forwards are the primary externally exposed attack surface. They should be minimized to strictly necessary services and protected by hardened endpoints.

## 6) DNS, DHCP, and Name Resolution

DNS stack:
- `dnsmasq` is the local resolver and DHCP server
- DoH proxy is enabled and integrated with `dnsmasq`
- Multiple DoH upstreams configured (Cloudflare + Google style setup)
- Local DNS served from loopback resolver listeners

DHCP:
- Separate DHCP pools for LAN and guest segments
- Static leases and local domain overrides are configured

Privacy/control note:
- Force-DNS behavior is enabled in DoH proxy integration, which helps keep client DNS on router-managed resolvers.

## 7) VPN and Tunneling

Active:
- AmneziaWG (`awg0`) is up and has stable uptime at audit moment

Installed but not active as primary path:
- OpenVPN package and profile files are present

Routing policy note:
- Current config indicates VPN is available and LAN forwarding to VPN zone is allowed, while default WAN route remains present.

## 8) QoS / Traffic Shaping

SQM state:
- WAN-targeted SQM profile exists but disabled
- Guest-limited SQM profile is enabled on `br-guest` using `cake`

Observed runtime qdisc:
- Active `cake` on guest bridge and corresponding IFB path
- FQ-CoDel present on physical interfaces as expected baseline

Interpretation:
- Guest bandwidth fairness/containment is actively enforced.
- WAN anti-bufferbloat policy is not currently enforced via enabled SQM profile.

## 9) Running Services and Exposure

Core services listening:
- SSH (`dropbear`) on 22
- Web UI/API (`uhttpd`) on 80/443
- DNS (`dnsmasq`) on 53
- Local DoH listeners on loopback high ports

Installed package footprint:
- ~282 installed packages
- Notable components: LuCI, AmneziaWG stack, OpenVPN, adblock, banIP, https-dns-proxy, nlbwmon, ruantiblock

Feature toggles:
- `adblock`: installed but disabled
- `banip`: installed but disabled

## 10) Security Findings (Sanitized)

High priority:
1. Sensitive credentials exist in configuration files (Wi-Fi keys, VPN secrets, auth material). They were intentionally omitted from this document.
2. SSH root password authentication is enabled in `dropbear` (in addition to key-based auth).
3. WAN-facing port forwards expose internal hosts/services.

Medium priority:
1. Repeated Wi-Fi auth failures in logs suggest either misconfigured client attempts or noisy probing.
2. Link speed/state flaps observed on at least one LAN port in kernel logs, potentially cable/PHY/client related.

## 11) Recommended Hardening Plan

Immediate:
1. Disable SSH password login for root; keep key-based auth only.
2. Rotate Wi-Fi and VPN secrets that have ever been shared/exported in plain text.
3. Audit WAN DNAT rules; remove unused forwards and add host-level firewalling on exposed internal servers.

Short term:
1. Restrict router management UI/SSH explicitly to LAN only (and optionally to a management allowlist).
2. Enable brute-force protection and login throttling where supported.
3. Review OpenVPN profiles and remove stale/unused credentials.

Operational:
1. Investigate recurring 2.4 GHz auth failures by identifying MAC and client ownership.
2. Check cabling/switchport/client NIC for interfaces showing link flaps.
3. Decide whether WAN SQM should be enabled to reduce latency under load.

## 12) Commands Used During Audit (for reproducibility)

Representative command groups:
- System identity: `ubus call system board`, `uname -a`, `cat /etc/openwrt_release`
- Filesystem/memory: `df -h`, `mount`, `free -h`, `cat /proc/meminfo`
- Network: `uci show network`, `ip addr`, `ip route`, `ip -6 route`, `ifstatus <iface>`
- Wireless: `uci show wireless`, `wifi status`
- Firewall/DHCP: `uci show firewall`, `uci show dhcp`
- Services/processes: `ps w`, `netstat -lntup`, `/etc/rc.d/S*`
- Runtime logs: `logread`

Note: This overview intentionally redacts secrets and omits private key/password values.
