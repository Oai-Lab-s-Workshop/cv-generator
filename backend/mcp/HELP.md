# Resumate MCP Server

## Required environment variables

- `POCKETBASE_BASE_URL`: internal PocketBase base URL used by the MCP service. In Docker Compose this should normally stay on the private service URL, `http://pocketbase:${POCKETBASE_INTERNAL_PORT:-8090}`; PocketBase does not need a public domain or host port.
- `POCKETBASE_SERVICE_USER_EMAIL`: dedicated PocketBase user email for the MCP service
- `POCKETBASE_SERVICE_USER_PASSWORD`: password for that service user
- `FRONTEND_BASE_URL`: public frontend origin used when returning profile URLs
- `MCP_PUBLIC_BASE_URL`: public HTTPS origin for OAuth issuer and metadata, for example `https://mcp.example.com`
- `MCP_OAUTH_JWK`: private RSA JWK JSON used to sign OAuth JWT access tokens

Optional OAuth variables:

- `MCP_OAUTH_ACCESS_TOKEN_TTL`: OAuth access-token lifetime, default `1h`
- `MCP_OAUTH_REFRESH_TOKEN_TTL`: OAuth refresh-token lifetime, default `90d`
- `MCP_OAUTH_ALLOWED_REDIRECT_URI_PATTERNS`: comma-separated dynamic-client redirect allow-list, default `https://claude.ai/*`

Optional MCP variables:

- `resumate.mcp.idempotency.ttl`: idempotency key cache TTL, default `5m`

## Agent rules

Agent-facing rules are maintained in `mcp/AGENTS.md`. Read that file for the complete workflow, do's/don'ts, idempotency-key guidance, and error-handling reference.

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

Use this MCP server when a user asks you to create, tailor, adapt, optimize, or customize a CV/resume from their existing Resumate data. The server lets you inspect available templates, load the authenticated user's reusable resume material, create a new public tailored CV profile, and update existing profiles.

Do not invent template IDs or record IDs. Use only template IDs returned by `listTemplates` and user-owned record IDs returned by `listProfileMaterial`. A successful create call returns a shareable frontend URL for the created profile.

## Tools

| Tool | Purpose |
|---|---|
| `listTemplates` | List available CV templates with `extraSchema` descriptors |
| `whoAmI` | Return the authenticated principal identity |
| `listProfileMaterial` | Load the user's skills, jobs, projects, achievements, degrees, and hobbies |
| `listCvProfiles` | List the authenticated user's saved CV profiles (newest first) with `slug`, `label`, `templateId`, and `frontendUrl` |
| `createTailoredCvProfile` | Create a new tailored CV profile. Pass an `idempotencyKey` scoped to the job offer to prevent duplicates. |
| `updateCvProfile` | Edit an existing profile by slug or id. Only fields explicitly provided are updated (PATCH semantics). |

### Agent workflow

1. Call `listTemplates` and choose one returned `template.id` for `templateId`.
2. Call `listProfileMaterial` and select only IDs from the returned material records. Identity, contact, and presentation metadata are handled by the selected template and are not returned by this tool.
3. Call `listCvProfiles` to check whether a suitable resume already exists. Reuse its `slug` with `updateCvProfile` instead of creating a near-duplicate.
4. Call `createTailoredCvProfile` with a non-empty `label`, the chosen `templateId`, a role-focused `professionalSummary`, selected ID arrays, and only `templateExtra` fields listed in the selected template's `extraSchema`.
5. To refine a profile, call `updateCvProfile` with the profile's `slug` and only the fields you want to change.

Always include `label` in create calls. The server does not generate it; choose a concise saved-resume label such as `Acme - Senior Backend Engineer`.

If validation fails, correct the missing or invalid field and retry with the fixed value. Do not repeat the same invalid call.

### Idempotency (deduplication)

Prevent accidental duplicate profiles by passing an `idempotencyKey` on `createTailoredCvProfile` calls:

- Pick a descriptive key scoped to the job offer, e.g. `"create-profile-for-job-acme-senior"`.
- If the same key is reused within 5 minutes, the server reroutes to `updateCvProfile` on the original profile instead of creating a duplicate.
- The response includes `"deduplicated": true` when rerouted — treat this as normal success.
- Concurrent creates with different keys (different job offers) proceed independently.

### Empty profile guard

`createTailoredCvProfile` rejects requests that would produce a profile with no substantive content. Provide at least one of: `skillIds`, `jobIds`, or `professionalSummary`.

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
- `supa.compactMode`: boolean requesting more compact A4 layout behavior

## Local run

Once Java is available locally, run the MCP server from `mcp/` with:

```bash
./mvnw spring-boot:run
```

The MCP endpoint is exposed at `/mcp`.
