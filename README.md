# LavronOS UPS Module

Independent LavronOS module for UPS telemetry exposed through Synology
UPS-MIB or DSM WebAPI.

The module owns its page, dashboard widget and server runtime. Its portable
Net-SNMP binaries are resolved from the installed module package.

The release workflow builds this module's own portable Net-SNMP 5.9.5.2
`snmpget` and `snmpwalk` runtimes for `linux-x64` and `linux-arm64`, verifies
each bundle inside Debian and publishes:

- `ups-monitor-<version>.zip`
- `ups-monitor-<version>.zip.sha256`

The LavronOS WordPress Marketplace periodically synchronizes the published
GitHub Release ZIP. Release history is maintained in
[CHANGELOG.md](CHANGELOG.md).

Create a release with a tag matching `module.json`, for example:

```bash
git tag -a v0.1.6 -m "Release UPS module 0.1.6"
git push origin main
git push origin v0.1.6
```

Generated binaries, third-party runtime files and release ZIPs are not stored
in Git.

No WordPress credentials are required in this repository.
