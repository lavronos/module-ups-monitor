# Changelog

All notable changes to the LavronOS UPS module are documented here.

## [Unreleased]

## [0.1.6] - 2026-06-13

### Added
- Added a module-owned server runtime entry for UPS status requests.

### Changed
- Removed direct WordPress uploads from the release workflow; Marketplace now synchronizes published GitHub Releases.
- Included the server runtime in release ZIP packages.

## [0.1.5] - 2026-06-12

### Changed
- Moved the module into an independent repository and release lifecycle.
- Bundled architecture-specific `snmpget` and `snmpwalk` runtimes inside the module ZIP.
- Added reproducible Net-SNMP 5.9.5.2 builds for `linux-x64` and `linux-arm64`.
- Switched ARM64 package builds to GitHub's native Ubuntu ARM runner.

### Fixed
- Included the Net-SNMP shared libraries required by the bundled `snmpget` and `snmpwalk` executables.

## [0.1.4] - 2026-06-08

### Changed
- Removed Net-SNMP tools from the base LavronOS image.

## [0.1.3] - 2026-06-03

### Added
- Added Telegram actions and normalized DSM telemetry.
