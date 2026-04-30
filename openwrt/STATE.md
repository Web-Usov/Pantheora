# OpenWrt Environment State

Updated: 2026-04-30 17:30 UTC

## Access
- SSH target: `root@192.168.1.1`
- Auth method: SSH key
- Notes: interactive password not required in last audits

## Device
- Model: Xiaomi AX3600
- Board: `xiaomi,ax3600`
- OpenWrt: `23.05.2 (r23630-842932a63d)`
- Kernel: `5.15.137`
- Target: `ipq807x/generic`

## Network
- LAN: `192.168.1.1/24` (`br-lan`)
- Guest: `192.168.30.1/24` (`br-guest`)
- WAN: DHCP IPv4 uplink (public IP dynamic)
- VPN interfaces: `awg0` (AmneziaWG), active during last audit
- Routing policy: default via WAN, LAN forwarding allowed to WAN and VPN zone

## Services
- `dnsmasq`: enabled/running
- `firewall4`: enabled/running
- `dropbear`: enabled/running
- `uhttpd`: enabled/running
- `ruantiblock`: enabled/running
- `https-dns-proxy`: enabled/running

## Custom packages
- `ruantiblock`: `2.1.0-r2`
- `luci-app-ruantiblock`: `2.1.0-2`
- `luci-i18n-ruantiblock-ru`: `2.1.0-2`
- `adblock`: installed (disabled at last audit)
- `banip`: installed (disabled at last audit)
- `amneziawg`: installed (active interface present)

## Security notes
- Secrets must remain redacted in all reports (Wi-Fi keys, VPN keys, auth files).
- SSH root password auth was enabled at last audit; key auth also present.
- WAN port forwards exist; review exposed services periodically.

## Last audit
- Scope: system inventory, firewall/network/wifi/vpn review, ruantiblock review
- Findings:
- ruantiblock active, daily update job configured (`03:00`)
- large ruantiblock FQDN dataset generated successfully
- recurring 2.4 GHz auth-failure log lines observed for one client MAC
- Commands:
- `ubus call system board`
- `uci show network firewall dhcp wireless ruantiblock`
- `ip addr`, `ip route`, `ifstatus wan awg0 guest`
- `/usr/bin/ruantiblock status`
- `logread`, `opkg list-installed`

