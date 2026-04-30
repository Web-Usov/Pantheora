# ruantiblock: audit summary (sanitized)

Audit date: 2026-04-30 (UTC)
Device: OpenWrt 23.05.2 on Xiaomi AX3600

## Installed components

- `ruantiblock 2.1.0-r2`
- `luci-app-ruantiblock 2.1.0-2`
- `luci-i18n-ruantiblock-ru 2.1.0-2`

Main files:
- `/usr/bin/ruantiblock`
- `/etc/init.d/ruantiblock`
- `/etc/config/ruantiblock`
- `/etc/ruantiblock/*`
- `/usr/share/ruantiblock/*`

## Runtime state

- Service autostart: enabled (`S99ruantiblock`)
- Status: enabled (`raw-status = 0`)
- Daily update job present in cron: `0 3 * * * /usr/bin/ruantiblock update`
- Last successful update at audit time: `2026-04-30 03:00`

Generated artifacts observed:
- `/tmp/dnsmasq.d/02-ruantiblock.dnsmasq`: ~401,970 lines
- `/tmp/dnsmasq.d/01-ruantiblock_user_instances.dnsmasq`: ~199 lines
- `/tmp/dnsmasq.d/00-ruantiblock_bypass.dnsmasq`: 0 lines
- `/var/ruantiblock/*` status/IP helper files present

## Current operating mode

Effective UCI profile (`/etc/config/ruantiblock`):
- `proxy_mode=2` (VPN mode)
- VPN interface: `awg0`
- `enable_fproxy=1` (full proxy mode enabled)
- `proxy_local_clients=0` (router-local traffic not proxied)
- `update_at_startup=1`
- `enable_logging=1`
- `bllist_preset=ruantiblock-fqdn`
- `bypass_mode=1`
- `bllist_fqdn_filter=1`
- `vpn_route_check=0`

User instances:
- `list1`: enabled
- `list2`: enabled (description: telegram-local-domains-ip)
- `list3/list4/list5`: disabled

Observed blacklist counters from `ruantiblock status`:
- Main list: CIDR `114`, IP `0`, FQDN `401958`
- User list1: FQDN `179`
- User list2: CIDR `9`, IP `3`, FQDN `20`

## Behavior notes

How this setup works at high level:
1. `ruantiblock` builds DNS and IP datasets from preset/user lists.
2. It writes dnsmasq include files into `/tmp/dnsmasq.d/`.
3. nftables sets/rules match blocked targets.
4. Matched traffic is routed according to proxy mode (here: VPN via `awg0`).

No explicit `ruantiblock` string was found in full nft ruleset grep at audit time, which is possible when sets/chains use generic names. Functional status and counters still indicate active processing.

## Configuration quality observations

1. Duplicate value in bypass IP list:
- `bypass_ip_list` contains the same IP twice.

2. Empty entry in user list1 bypass array:
- `u_bypass_ip_list` includes an empty list element before a real IP.

3. Update pipeline scale:
- ~402k dnsmasq lines is large but currently functioning.
- This can increase DNS reload/update cost on weaker devices.

4. Service script interface:
- `/etc/init.d/ruantiblock` uses custom start logic with optional update on startup.
- `status` is not implemented in init wrapper; use `/usr/bin/ruantiblock status`.

## Security/privacy notes

- This report intentionally excludes sensitive content from custom user lists and any secrets.
- Domain and IP entries in `/etc/ruantiblock/user_lists/*` may reveal user habits/services and should be treated as private configuration data.

## Recommended next steps

1. Clean config hygiene:
- remove duplicate `bypass_ip_list` item
- remove empty `u_bypass_ip_list` element in `list1`

2. Validate desired policy:
- confirm `enable_fproxy=1` is intentional for your traffic model
- confirm `vpn_route_check=0` is acceptable for your tunnel stability strategy

3. Add health checks:
- alert on failed daily updates
- keep periodic check of `ruantiblock status` counters and update timestamp

4. Performance guardrails:
- if DNS reload latency appears, tune list size/filtering (`fqdn_filter`, presets, user lists) and review low-value domains.
