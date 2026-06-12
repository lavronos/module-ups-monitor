# LavronOS UPS Module

Independent LavronOS module for UPS telemetry exposed through Synology
UPS-MIB or DSM WebAPI.

The release workflow builds this module's own portable Net-SNMP 5.9.5.2
`snmpget` and `snmpwalk` runtimes for `linux-x64` and `linux-arm64`, verifies
each bundle inside Debian and publishes:

- `ups-monitor-<version>.zip`
- `ups-monitor-<version>.zip.sha256`

When Marketplace secrets are configured, the release ZIP is imported and
approved on the LavronOS WordPress Marketplace automatically. Release history
is maintained in [CHANGELOG.md](CHANGELOG.md).

Create a release with a tag matching `module.json`, for example:

```bash
git tag -a v0.1.5 -m "Release UPS module 0.1.5"
git push origin main
git push origin v0.1.5
```

Generated binaries, third-party runtime files and release ZIPs are not stored
in Git.

Required repository secrets for automatic Marketplace publishing:

- `LAVRONOS_MARKETPLACE_URL`
- `LAVRONOS_MARKETPLACE_USER`
- `LAVRONOS_MARKETPLACE_APPLICATION_PASSWORD`
