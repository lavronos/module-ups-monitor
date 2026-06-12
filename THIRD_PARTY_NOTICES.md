# Third-Party Notices

This module bundles portable `snmpget` and `snmpwalk` runtimes built from the
unmodified Net-SNMP 5.9.5.2 source at commit
`319bbd0bb36547992c0e1302fef278c6f49d0c80`.

Net-SNMP is distributed under BSD-style licenses. The portable runtime also
contains the Alpine musl loader and libraries required by the two commands.

- Project: https://www.net-snmp.org/
- Source: https://github.com/net-snmp/net-snmp/tree/319bbd0bb36547992c0e1302fef278c6f49d0c80
- License: https://github.com/net-snmp/net-snmp/blob/319bbd0bb36547992c0e1302fef278c6f49d0c80/COPYING
- Build recipe: `build/net-snmp/Dockerfile`

The release workflow records the build version and source commit in every
generated platform bundle.
