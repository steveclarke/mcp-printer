# Testing against presswork

[presswork](https://github.com/vindeckyy/presswork) is a drop-in
replacement for the CUPS scheduler written in Rust - same IPP wire
protocol, same `/etc/cups` config, same spool layout. Because
mcp-printer talks to CUPS through the standard client tools and the
`CUPS_SERVER` environment variable, it works against presswork with no
code changes.

## Quick dev environment

`dev/compose.yaml` runs presswork in a container so you can develop
and test without touching your host CUPS install:

```sh
docker compose -f dev/compose.yaml up -d
```

Point the MCP server at it via `CUPS_SERVER`:

```sh
CUPS_SERVER=localhost:631 mcp-printer
```

(the `lp`/`lpstat` tools also honor `CUPS_SERVER`, so manual testing
against the container works the same way.)

Add a test queue inside the container if you have no real printer:

```sh
docker exec <container> lpadmin -p test -E -v file:/dev/null -m raw
lp -h localhost:631 -d test /etc/hostname
```

## Why test against presswork

- Memory-safe daemon - the IPP/HTTP/parser surface the MCP server hits
  is implemented in Rust.
- Disposable state - queues and spool live in volumes; reset with
  `docker compose -f dev/compose.yaml down -v`.
- Same semantics - presswork passes the upstream ipptool matrix
  (34/0/1) and the upstream `test/5.x` client suite (34/34).
