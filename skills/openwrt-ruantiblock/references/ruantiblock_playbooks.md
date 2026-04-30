# ruantiblock Playbooks

## Baseline inspection

```sh
ssh root@192.168.1.1 'opkg list-installed | grep -E "^ruantiblock|luci-app-ruantiblock|luci-i18n-ruantiblock"'
ssh root@192.168.1.1 'uci show ruantiblock'
ssh root@192.168.1.1 '/usr/bin/ruantiblock status; /usr/bin/ruantiblock raw-status'
ssh root@192.168.1.1 'wc -l /tmp/dnsmasq.d/00-ruantiblock_bypass.dnsmasq /tmp/dnsmasq.d/01-ruantiblock_user_instances.dnsmasq /tmp/dnsmasq.d/02-ruantiblock.dnsmasq'
```

## Add domain to bypass list (safe flow)

List selection rules:
- Use `/etc/ruantiblock/user_lists/list1` for small resource groups (up to 9 related entries).
- Use `/etc/ruantiblock/user_lists/list2` for large resource groups (10+ related entries).
- Every group must start with `# Resource: <name>`.

Example add flow (large group -> `list2`):

1. Backup before edit:
```sh
ssh root@192.168.1.1 'cp /etc/ruantiblock/user_lists/list2 /etc/ruantiblock/user_lists/list2.bak.$(date +%Y%m%d-%H%M%S)'
```

2. Ensure group header exists, then append domain if absent:
```sh
ssh root@192.168.1.1 'grep -Fxq "# Resource: example-service" /etc/ruantiblock/user_lists/list2 || printf "\n# Resource: example-service\n" >> /etc/ruantiblock/user_lists/list2'
ssh root@192.168.1.1 'grep -Fxq "example.com" /etc/ruantiblock/user_lists/list2 || echo "example.com" >> /etc/ruantiblock/user_lists/list2'
```

3. Apply changes (update only, no reboot/restart):
```sh
ssh root@192.168.1.1 '/usr/bin/ruantiblock update'
```

4. Validate:
```sh
ssh root@192.168.1.1 '/usr/bin/ruantiblock status'
ssh root@192.168.1.1 'grep -F "example.com" /tmp/dnsmasq.d/01-ruantiblock_user_instances.dnsmasq'
```

## Remove domain from bypass list

Example remove flow (`list2` shown; same pattern for `list1`):
```sh
ssh root@192.168.1.1 'cp /etc/ruantiblock/user_lists/list2 /etc/ruantiblock/user_lists/list2.bak.$(date +%Y%m%d-%H%M%S)'
ssh root@192.168.1.1 'sed -i "\\|^example.com$|d" /etc/ruantiblock/user_lists/list2'
ssh root@192.168.1.1 '/usr/bin/ruantiblock update'
ssh root@192.168.1.1 '/usr/bin/ruantiblock status'
ssh root@192.168.1.1 '! grep -F "example.com" /tmp/dnsmasq.d/01-ruantiblock_user_instances.dnsmasq'
```

## Troubleshooting quick checks

```sh
ssh root@192.168.1.1 'logread | grep -i ruantiblock | tail -n 200'
ssh root@192.168.1.1 'ls -lh /var/ruantiblock /tmp/dnsmasq.d/*ruantiblock*'
ssh root@192.168.1.1 'ifstatus awg0'
```

## Post-change state sync

After successful ruantiblock changes, update `<project_root>/openwrt/STATE.md`:
- what list changed
- update timestamp
- resulting status (`enabled/disabled`, key counters)
- presence/absence validation result from `01-ruantiblock_user_instances.dnsmasq`
- no raw sensitive entries
