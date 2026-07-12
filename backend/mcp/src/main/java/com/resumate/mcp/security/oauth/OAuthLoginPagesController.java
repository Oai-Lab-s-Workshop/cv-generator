package com.resumate.mcp.security.oauth;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.endpoint.OAuth2ParameterNames;
import org.springframework.security.oauth2.server.authorization.OAuth2AuthorizationConsent;
import org.springframework.security.oauth2.server.authorization.OAuth2AuthorizationConsentService;
import org.springframework.security.oauth2.server.authorization.client.RegisteredClient;
import org.springframework.security.oauth2.server.authorization.client.RegisteredClientRepository;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.stereotype.Controller;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.util.HtmlUtils;

import java.security.Principal;
import java.util.Arrays;
import java.util.Collections;
import java.util.Set;
import java.util.TreeSet;
import java.util.stream.Collectors;

@Controller
public class OAuthLoginPagesController {

    private final RegisteredClientRepository registeredClientRepository;
    private final OAuth2AuthorizationConsentService authorizationConsentService;

    public OAuthLoginPagesController(
            RegisteredClientRepository registeredClientRepository,
            OAuth2AuthorizationConsentService authorizationConsentService
    ) {
        this.registeredClientRepository = registeredClientRepository;
        this.authorizationConsentService = authorizationConsentService;
    }

    @GetMapping(value = "/login", produces = MediaType.TEXT_HTML_VALUE)
    ResponseEntity<String> login(
            CsrfToken csrfToken,
            @RequestParam(name = "error", required = false) String error
    ) {
        String errorHtml = StringUtils.hasText(error)
                ? "<p class=\"error\">Invalid email or password.</p>"
                : "";

        return html("""
                <!doctype html>
                <html lang="en">
                <head>
                  <meta charset="utf-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1">
                  <title>Sign in to Resumate MCP</title>
                  <style>%s</style>
                </head>
                <body>
                  <main class="card">
                    <p class="eyebrow">Resumate MCP</p>
                    <h1>Sign in</h1>
                    <p class="muted">Use your existing CV app account to connect claude.ai.</p>
                    %s
                    <form method="post" action="">
                      %s
                      <label>Email<input name="username" type="email" autocomplete="username" required autofocus></label>
                      <label>Password<input name="password" type="password" autocomplete="current-password" required></label>
                      <button type="submit">Continue</button>
                    </form>
                  </main>
                </body>
                </html>
                """.formatted(styles(), errorHtml, csrfInput(csrfToken)));
    }

    @GetMapping(value = "/oauth/consent", produces = MediaType.TEXT_HTML_VALUE)
    ResponseEntity<String> consent(
            Principal principal,
            Authentication authentication,
            CsrfToken csrfToken,
            @RequestParam(OAuth2ParameterNames.CLIENT_ID) String clientId,
            @RequestParam(OAuth2ParameterNames.SCOPE) String scope,
            @RequestParam(OAuth2ParameterNames.STATE) String state
    ) {
        RegisteredClient registeredClient = registeredClientRepository.findByClientId(clientId);
        if (registeredClient == null) {
            return ResponseEntity.badRequest()
                    .contentType(MediaType.TEXT_HTML)
                    .body("Unknown OAuth client.");
        }

        Set<String> requestedScopes = scopes(scope);
        Set<String> previouslyApprovedScopes = approvedScopes(registeredClient, principal);
        Set<String> scopesToApprove = new TreeSet<>(requestedScopes);
        scopesToApprove.removeAll(previouslyApprovedScopes);

        return html("""
                <!doctype html>
                <html lang="en">
                <head>
                  <meta charset="utf-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1">
                  <title>Authorize claude.ai</title>
                  <style>%s</style>
                </head>
                <body>
                  <main class="card wide">
                    <p class="eyebrow">Resumate MCP</p>
                    <h1>Authorize access</h1>
                    <p><strong>%s</strong> wants to access your account <strong>%s</strong>.</p>
                    <section class="permissions">
                      <h2>What claude.ai can do</h2>
                      <ul>
                        <li>Read your profile material for CV tailoring.</li>
                        <li>Create tailored CV profiles in your account.</li>
                      </ul>
                    </section>
                    <form method="post" action="/oauth/authorize">
                      %s
                      <input type="hidden" name="client_id" value="%s">
                      <input type="hidden" name="state" value="%s">
                      %s
                      %s
                      <button type="submit">Allow access</button>
                      <button class="secondary" type="submit" onclick="document.querySelectorAll('input[name=scope]').forEach((input) => input.checked = false);">Deny</button>
                    </form>
                  </main>
                </body>
                </html>
                """.formatted(
                styles(),
                escape(registeredClient.getClientName()),
                escape(displayPrincipal(authentication, principal)),
                csrfInput(csrfToken),
                escape(clientId),
                escape(state),
                scopeInputs(scopesToApprove),
                previouslyApprovedScopes(previouslyApprovedScopes)
        ));
    }

    private Set<String> approvedScopes(RegisteredClient registeredClient, Principal principal) {
        OAuth2AuthorizationConsent consent = authorizationConsentService.findById(
                registeredClient.getId(),
                principal.getName()
        );
        return consent == null ? Collections.emptySet() : new TreeSet<>(consent.getScopes());
    }

    private static Set<String> scopes(String scope) {
        if (!StringUtils.hasText(scope)) {
            return Collections.emptySet();
        }
        return Arrays.stream(scope.split(" "))
                .filter(StringUtils::hasText)
                .collect(Collectors.toCollection(TreeSet::new));
    }

    private static String scopeInputs(Set<String> scopes) {
        if (scopes.isEmpty()) {
            return "";
        }
        return scopes.stream()
                .map((scope) -> """
                        <label class="check"><input type="checkbox" name="scope" value="%s" checked> %s</label>
                        <p class="scope-help">%s</p>
                        """.formatted(escape(scope), escape(scope), scopeDescription(scope)))
                .collect(Collectors.joining());
    }

    private static String previouslyApprovedScopes(Set<String> scopes) {
        if (scopes.isEmpty()) {
            return "";
        }
        String items = scopes.stream()
                .map((scope) -> "<li>" + escape(scope) + "</li>")
                .collect(Collectors.joining());
        return "<p class=\"muted\">Already approved:</p><ul>" + items + "</ul>";
    }

    private static String displayPrincipal(Authentication authentication, Principal principal) {
        if (authentication != null && authentication.getPrincipal() instanceof PocketBaseOAuthPrincipal pocketBasePrincipal) {
            return pocketBasePrincipal.displayName();
        }
        return principal.getName();
    }

    private static String scopeDescription(String scope) {
        if ("mcp".equals(scope)) {
            return "Read profile material and create CV profiles through the MCP tools.";
        }
        return "Grant the requested OAuth permission.";
    }

    private static String csrfInput(CsrfToken csrfToken) {
        if (csrfToken == null) {
            return "";
        }
        return "<input type=\"hidden\" name=\"" + escape(csrfToken.getParameterName()) + "\" value=\"" + escape(csrfToken.getToken()) + "\">";
    }

    private static ResponseEntity<String> html(String body) {
        return ResponseEntity.ok().contentType(MediaType.TEXT_HTML).body(body);
    }

    private static String escape(String value) {
        return HtmlUtils.htmlEscape(value == null ? "" : value);
    }

    private static String styles() {
        return """
                :root { color-scheme: light; font-family: Inter, ui-sans-serif, system-ui, sans-serif; }
                body { min-height: 100vh; margin: 0; display: grid; place-items: center; background: #f7f2ea; color: #1f2933; }
                .card { width: min(92vw, 420px); background: #fffaf3; border: 1px solid #eadfce; border-radius: 18px; padding: 32px; box-shadow: 0 20px 60px rgba(69, 48, 24, .12); }
                .wide { width: min(92vw, 560px); }
                .eyebrow { margin: 0 0 8px; color: #9a5b16; font-size: 12px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; }
                h1 { margin: 0 0 12px; font-size: 30px; }
                h2 { margin: 0 0 8px; font-size: 18px; }
                .muted, .scope-help { color: #667085; }
                label { display: grid; gap: 6px; margin-top: 16px; font-weight: 700; }
                input[type=email], input[type=password] { border: 1px solid #d8c8b1; border-radius: 12px; font: inherit; padding: 12px; background: white; }
                .check { display: block; font-weight: 700; }
                button { width: 100%; margin-top: 20px; border: 0; border-radius: 999px; padding: 13px 18px; background: #8b4513; color: white; font: inherit; font-weight: 800; cursor: pointer; }
                button.secondary { background: transparent; color: #8b4513; border: 1px solid #d8c8b1; }
                .error { color: #b42318; font-weight: 700; }
                .permissions { margin: 22px 0; padding: 18px; background: white; border: 1px solid #eadfce; border-radius: 14px; }
                """;
    }
}
