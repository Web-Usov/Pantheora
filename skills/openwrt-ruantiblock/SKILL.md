---
name: openwrt-ruantiblock
description: Operate ruantiblock on OpenWrt routers: inspect status, update lists, add/remove bypass domains, validate nft/dnsmasq integration, and apply safe changes. Uses context from openwrt/STATE.md when available.
---

# OpenWrt ruantiblock Skill

Use this skill when the task is specifically about `ruantiblock`.

## Dependency on OpenWrt state

Before actions:
1. Read `<project_root>/openwrt/STATE.md` if present.
2. Extract SSH target and baseline service/network context.
3. If `STATE.md` is missing, continue with user-provided target and recommend creating state via `openwrt` skill workflow.

## Core tasks

- Show current status and counters.
- Add domain/IP/CIDR to user lists.
- Remove domain/IP/CIDR from user lists.
- Trigger update/reload and validate effect.
- Diagnose failures (update errors, nft/dnsmasq mismatch, route issues).

## Safety rules

1. Never reveal secrets from configs/lists in chat.
2. Backup touched list/config before edit.
3. Apply minimal edit only.
4. Validate with `ruantiblock status` and generated files.

## Preferred list policy

- Use `/etc/ruantiblock/user_lists/list2` for focused service domains (for example messenger/video domains), unless user requests another list.
- Keep one entry per line.
- Avoid duplicates.
- Preserve comments and grouping.

## Validation checklist after change

1. `/usr/bin/ruantiblock update` (or `reload` when update is not needed)
2. `/usr/bin/ruantiblock status`
3. Check generated dnsmasq include files in `/tmp/dnsmasq.d/`
4. Optional targeted connectivity check from client side if user asks

## Playbooks

Use exact command sequences from:
- [ruantiblock_playbooks.md](./references/ruantiblock_playbooks.md)

