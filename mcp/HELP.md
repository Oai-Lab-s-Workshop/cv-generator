# Resumate MCP Server

## Required environment variables

- `POCKETBASE_BASE_URL`: PocketBase base URL, for example `http://localhost:8090`
- `POCKETBASE_SERVICE_USER_EMAIL`: dedicated PocketBase user email for the MCP service
- `POCKETBASE_SERVICE_USER_PASSWORD`: password for that service user
- `FRONTEND_BASE_URL`: public frontend origin used when returning profile URLs

## PocketBase service user

The MCP server authenticates to PocketBase as a dedicated `users` record with `isMcpServiceAccount=true`.

Create that user before running the MCP server:

1. create a normal PocketBase user record
2. set `isMcpServiceAccount` to `true`
3. keep its credentials in MCP runtime configuration only
4. do not use PocketBase superadmin credentials for normal MCP traffic

## Runtime behavior

- incoming MCP requests authenticate with a delegated AI bearer token stored in `ai_tokens`
- the MCP server hashes that bearer token and resolves the owning PocketBase user
- the PocketBase service user performs the actual reads and writes on behalf of that owner
- created CV profiles are returned as normal frontend URLs using `FRONTEND_BASE_URL`

## Local run

Once Java is available locally, run the MCP server from `mcp/` with:

```bash
./mvnw spring-boot:run
```

The MCP endpoint is exposed at `/mcp`.
