# Resumate MCP Server

## Required environment variables

- `POCKETBASE_BASE_URL`: PocketBase base URL. Defaults to `http://localhost:${POCKETBASE_PORT:-8090}` locally and `http://pocketbase:${POCKETBASE_INTERNAL_PORT:-8090}` in Docker Compose.
- `POCKETBASE_SERVICE_USER_EMAIL`: dedicated PocketBase user email for the MCP service
- `POCKETBASE_SERVICE_USER_PASSWORD`: password for that service user
- `FRONTEND_BASE_URL`: public frontend origin used when returning profile URLs
- `MCP_PUBLIC_BASE_URL`: public HTTPS origin for OAuth issuer and metadata, for example `https://mcp.example.com`
- `MCP_OAUTH_JWK`: private RSA JWK JSON used to sign OAuth JWT access tokens

Optional OAuth variables:

- `MCP_OAUTH_ACCESS_TOKEN_TTL`: OAuth access-token lifetime, default `1h`
- `MCP_OAUTH_REFRESH_TOKEN_TTL`: OAuth refresh-token lifetime, default `90d`
- `MCP_OAUTH_ALLOWED_REDIRECT_URI_PATTERNS`: comma-separated dynamic-client redirect allow-list, default `https://claude.ai/*`

## OAuth key generation

Generate a private RSA JWK for `MCP_OAUTH_JWK` and keep it in deployment secrets. Do not commit the generated value.

```bash
node - <<'NODE'
const { generateKeyPairSync } = require('node:crypto');
const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
console.log(JSON.stringify(privateKey.export({ format: 'jwk' })));
NODE
```

For Docker Compose, put the single-line JSON output in `.env` as `MCP_OAUTH_JWK='{"kty":"RSA",...}'` and set `MCP_PUBLIC_BASE_URL` to the externally reachable HTTPS URL of this MCP server.

## API key auth

Incoming MCP requests authenticate with the `API_KEY` header. The API key is a user-generated secret stored hashed in `ai_tokens`.

## Agent purpose

Use this MCP server when a user asks you to create, tailor, adapt, optimize, or customize a CV/resume from their existing Resumate data. The server lets you inspect available templates, load the authenticated user's reusable resume material, and create a new public tailored CV profile for a specific job or opportunity.

Do not invent template IDs or record IDs. Use only template IDs returned by `listTemplates` and user-owned record IDs returned by `listProfileMaterial`. A successful create call returns a shareable frontend URL for the created profile.

## Agent workflow

1. Call `listTemplates` and choose one returned `template.id` for `templateId`.
2. Call `listProfileMaterial` and select only IDs from the returned user records.
3. Call `createTailoredCvProfile` with a non-empty `label`, the chosen `templateId`, a role-focused `professionalSummary`, selected ID arrays, and only `templateExtra` fields listed in the selected template's `extraSchema`.

Always include `label` in create calls. The server does not generate it; choose a concise saved-resume label such as `Acme - Senior Backend Engineer`.

If validation fails, correct the missing or invalid field and retry `createTailoredCvProfile` with the fixed value. Do not repeat the same invalid call.

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
