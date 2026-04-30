# OpenWrt Playbooks

## STATE.md template

```md
# OpenWrt Environment State

Updated: YYYY-MM-DD HH:MM UTC

## Access
- SSH target: root@192.168.1.1
- Auth method: ssh key

## Device
- Model: ...
- Board: ...
- OpenWrt: ...
- Kernel: ...

## Network
- LAN: ...
- WAN: ...
- VPN interfaces: ...
- Guest network: ...

## Services
- dnsmasq: enabled/running
- firewall: enabled/running
- dropbear: enabled/running
- uhttpd: enabled/running
- ruantiblock: enabled/running/disabled

## Custom packages
- ruantiblock: version
- luci-app-ruantiblock: version
- adblock: version
- banip: version
- https-dns-proxy: version

## Security notes
- secrets redacted
- exposed WAN forwards summary
- ssh password auth on/off

## Last audit
- Scope: ...
- Findings: ...
- Commands: ...
```

## Initial state bootstrap

1. Connectivity and identity:
```sh
ssh -o BatchMode=yes -o ConnectTimeout=8 root@192.168.1.1 'ubus call system board'
```

2. Core network and services:
```sh
ssh root@192.168.1.1 'uci show network; uci show firewall; ip addr; ip route'
ssh root@192.168.1.1 'for f in /etc/rc.d/S*; do basename "$f"; done | sort'
```

3. Package snapshot:
```sh
ssh root@192.168.1.1 'opkg list-installed'
```

4. Create/update `openwrt/STATE.md` using sanitized summary only.

## Quick audit (non-invasive)

```sh
ssh root@192.168.1.1 'ubus call system board; free -h; df -h'
ssh root@192.168.1.1 'ifstatus wan; ifstatus wan6; ip -6 route'
ssh root@192.168.1.1 'wifi status'
ssh root@192.168.1.1 'logread | tail -n 200'
```

Then update `STATE.md`:
- what changed since previous audit
- known issues and timestamps
- no secrets

