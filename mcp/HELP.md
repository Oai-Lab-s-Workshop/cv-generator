# Resumate MCP Server

## Required environment variables

- `POCKETBASE_BASE_URL`: PocketBase base URL, for example `http://localhost:8090`
- `POCKETBASE_SERVICE_USER_EMAIL`: dedicated PocketBase user email for the MCP service
- `POCKETBASE_SERVICE_USER_PASSWORD`: password for that service user
- `FRONTEND_BASE_URL`: public frontend origin used when returning profile URLs

## API key auth

Incoming MCP requests authenticate with the `API_KEY` header. The API key is a user-generated secret stored hashed in `ai_tokens`.

## Internal PocketBase access

The current MCP server still authenticates to PocketBase as a dedicated internal `users` record with `isMcpServiceAccount=true` so it can read the API key owner's data and create CV profiles on their behalf.

Create that user before running the MCP server:

1. create a normal PocketBase user record
2. set `isMcpServiceAccount` to `true`
3. keep its credentials in MCP runtime configuration only
4. do not use PocketBase superadmin credentials for normal MCP traffic

## Runtime behavior

- incoming MCP requests authenticate with an `API_KEY` stored in `ai_tokens`
- the MCP server hashes that API key and resolves the owning PocketBase user
- the PocketBase service user performs the reads and CV profile creation on behalf of that owner
- created CV profiles are returned as normal frontend URLs using `FRONTEND_BASE_URL`

## Template-specific extra data

CV profiles support an `extra` JSON object for template-specific fields. MCP clients should call `listTemplates` before `createTailoredCvProfile`; each template descriptor includes an `extraSchema` array documenting fields the AI may populate.

When creating a profile, pass selected-template values in `templateExtra`:

```json
{
  "templateId": "modern",
  "templateExtra": {
    "headline": "Senior full-stack developer focused on product delivery",
    "accentColor": "#2563eb"
  }
}
```

The MCP server validates field ids and value types, validates source-backed IDs against the API key owner, and stores the data as `cv_profiles.extra[templateId]`.

Current supported examples:

- `bento.qrCodeUrl`: URL encoded into the QR code on the bento card. Leave empty to auto-generate from the profile public route.
- `modern.headline`: string shown near the candidate name
- `modern.accentColor`: CSS color string used as the visual accent
- `supa.featuredProjectIds`: array of owned project IDs to prioritize in the project section
- `supa.compactMode`: boolean requesting more compact A4 layout behavior

## Local run

Once Java is available locally, run the MCP server from `mcp/` with:

```bash
./mvnw spring-boot:run
```

The MCP endpoint is exposed at `/mcp`.
