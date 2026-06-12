# syntax=docker/dockerfile:1.7
FROM alpine:3.22 AS build

ARG NET_SNMP_VERSION=5.9.5.2
ARG NET_SNMP_COMMIT=319bbd0bb36547992c0e1302fef278c6f49d0c80

RUN apk add --no-cache \
    autoconf \
    automake \
    build-base \
    git \
    libtool \
    linux-headers \
    openssl-dev \
    pax-utils \
    perl

WORKDIR /src

RUN git clone --filter=blob:none https://github.com/net-snmp/net-snmp.git net-snmp \
    && cd net-snmp \
    && git checkout --detach "${NET_SNMP_COMMIT}" \
    && test "$(git rev-parse HEAD)" = "${NET_SNMP_COMMIT}"

WORKDIR /src/net-snmp

RUN autoreconf -fi \
    && ./configure \
      --prefix=/opt/net-snmp \
      --disable-agent \
      --disable-embedded-perl \
      --disable-manuals \
      --without-perl-modules \
      --without-python-modules \
      --with-defaults \
      --with-default-snmp-version=3 \
      --with-logfile=/tmp/net-snmp.log \
      --with-openssl \
      --with-persistent-directory=/tmp/net-snmp \
      --with-sys-contact=LavronOS \
      --with-sys-location=LavronOS \
    && make -j"$(nproc)" \
    && make install

RUN set -eux; \
    architecture="$(uname -m)"; \
    case "$architecture" in \
      x86_64) loader="/lib/ld-musl-x86_64.so.1" ;; \
      aarch64) loader="/lib/ld-musl-aarch64.so.1" ;; \
      *) echo "Unsupported architecture: $architecture" >&2; exit 1 ;; \
    esac; \
    loader_name="$(basename "$loader")"; \
    mkdir -p /out/lib; \
    cp -a /opt/net-snmp/lib/. /out/lib/; \
    for command in snmpget snmpwalk; do \
      cp "/opt/net-snmp/bin/$command" "/out/$command.bin"; \
      LD_LIBRARY_PATH=/opt/net-snmp/lib lddtree -l "/opt/net-snmp/bin/$command" \
        | while read -r dependency; do \
            test -f "$dependency" || continue; \
            cp -L "$dependency" "/out/lib/$(basename "$dependency")"; \
          done; \
      printf '%s\n' \
        '#!/bin/sh' \
        'set -eu' \
        'base_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)' \
        "loader=\"\$base_dir/lib/$loader_name\"" \
        'export MIBS=' \
        'export MIBDIRS=' \
        "exec \"\$loader\" --library-path \"\$base_dir/lib\" \"\$base_dir/$command.bin\" \"\$@\"" \
        > "/out/$command"; \
      chmod 0755 "/out/$command" "/out/$command.bin"; \
    done; \
    cp -L "$loader" "/out/lib/$(basename "$loader")"; \
    strip /out/*.bin /out/lib/*.so* 2>/dev/null || true; \
    cp COPYING /out/NET_SNMP_LICENSE.txt; \
    printf '%s\n' \
      "Net-SNMP version: ${NET_SNMP_VERSION}" \
      "Net-SNMP commit: ${NET_SNMP_COMMIT}" \
      > /out/BUILD_INFO.txt

FROM scratch AS export
COPY --from=build /out/ /
