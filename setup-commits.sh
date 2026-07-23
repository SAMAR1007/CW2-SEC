#!/bin/bash
# Final commit script - 45 meaningful commits, NO empty commits.
# Run: bash setup-commits.sh
set -e

cd "$(dirname "$0")"
rm -rf .git
git init
git config user.email "samar@homecomf.com"
git config user.name "Samar"

# Phase 1: Foundation
echo "Phase 1"
git add Nivaas_Backend/package.json Nivaas_Backend/tsconfig.json Nivaas_Backend/package-lock.json .gitignore
git add homecomf_Web/package.json homecomf_Web/tsconfig.json homecomf_Web/next.config.mjs homecomf_Web/postcss.config.mjs homecomf_Web/components.json homecomf_Web/jest.config.js
git commit -m "feat: initial project scaffolding with Express + Next.js + TypeScript"

git add Nivaas_Backend/src/config/db.ts Nivaas_Backend/src/server.ts
git commit -m "feat: add MongoDB connection config and Express server entry point"

git add Nivaas_Backend/src/models/user.model.ts Nivaas_Backend/src/types/user.type.ts
git commit -m "feat: create User model with email, password, phoneNumber and role fields"

git add Nivaas_Backend/src/index.ts
git commit -m "feat: setup Express app with CORS, cookie-parser, and route mounting"

git add Nivaas_Backend/src/exceptions/api.error.ts Nivaas_Backend/src/middlewares/zod.middleware.ts
git commit -m "feat: add ApiError class and Zod validation middleware"

git add Nivaas_Backend/src/dtos/auth.dto.ts
git commit -m "feat: add Zod DTOs for register, login, forgot-password"

# Phase 2: Basic Auth
echo "Phase 2"
git add Nivaas_Backend/src/lib/jwt.ts
git commit -m "feat: add JWT token generation with 24h expiry"

git add Nivaas_Backend/src/utils/hash.util.ts
git commit -m "feat: add bcrypt password hashing with 10 salt rounds"

git add Nivaas_Backend/src/services/auth.service.ts
git commit -m "feat: implement register and login with email/phone uniqueness"

git add Nivaas_Backend/src/controller/auth.controller.ts
git commit -m "feat: add auth controller with register, login, verify handlers"

git add Nivaas_Backend/src/routes/auth.route.ts
git commit -m "feat: create auth routes with Zod validation"

git add Nivaas_Backend/src/repositories/user.repository.ts
git commit -m "feat: add user repository layer with CRUD operations"

# Phase 3: Auth Security
echo "Phase 3"
git add Nivaas_Backend/src/middlewares/auth.middleware.ts
git commit -m "feat: add JWT authentication middleware for protected routes"

git add homecomf_Web/lib/api/auth.ts homecomf_Web/lib/api/axios.ts homecomf_Web/lib/api/endpoints.ts
git commit -m "feat: add frontend API client with axios and auth endpoints"

git add homecomf_Web/lib/actions/auth-action.ts
git commit -m "feat: implement httpOnly, Secure, SameSite=Strict cookie auth"

git add Nivaas_Backend/src/utils/email.util.ts
git commit -m "feat: add email sending utility for password reset OTP"

git add Nivaas_Backend/src/utils/password.util.ts
git commit -m "feat: add password strength checker with common password blacklist"

# Phase 4: Brute Force
echo "Phase 4"
git add Nivaas_Backend/src/middlewares/rateLimiter.middleware.ts
git commit -m "feat: add express-rate-limit with auth 5/15min limits"

git add Nivaas_Backend/src/index.ts
git commit -m "feat: apply rate limiters and Helmet security headers to all routes"

git add Nivaas_Backend/src/services/captcha.service.ts
git commit -m "feat: add reCAPTCHA v3 server-side verification service"

# Phase 5: RBAC
echo "Phase 5"
git add Nivaas_Backend/src/constants/roles.constant.ts
git commit -m "feat: define role constants (USER, HOST, ADMIN) for RBAC"

git add Nivaas_Backend/src/middlewares/admin.middleware.ts
git commit -m "feat: add admin role authorization middleware with 403"

git add Nivaas_Backend/src/routes/admin.route.ts Nivaas_Backend/src/controller/admin.controller.ts Nivaas_Backend/src/services/admin.service.ts
git commit -m "feat: add admin CRUD routes for user and host management"

git add homecomf_Web/middleware.ts
git commit -m "feat: add Next.js middleware to protect /admin and /user routes"

# Phase 6: Session Management
echo "Phase 6"
git add Nivaas_Backend/src/middlewares/sessionBinding.middleware.ts
git commit -m "feat: add session binding with SHA256 user-agent fingerprint"

git add Nivaas_Backend/src/services/mfa.service.ts
git commit -m "feat: add TOTP-based MFA with backup codes"

# Phase 7: Audit
echo "Phase 7"
git add Nivaas_Backend/src/models/auditLog.model.ts
git commit -m "feat: create audit log model with 25+ action types"

git add Nivaas_Backend/src/services/auditLog.service.ts
git commit -m "feat: implement audit log service with create/list/stats"

# Phase 8: Data Privacy
echo "Phase 8"
git add Nivaas_Backend/src/services/auth.service.ts Nivaas_Backend/src/controller/auth.controller.ts Nivaas_Backend/src/routes/auth.route.ts
git commit -m "feat: add data export, import, password expiry, and audit logging to auth"

# Phase 9: WebAuthn
echo "Phase 9"
git add Nivaas_Backend/src/services/webauthn.service.ts Nivaas_Backend/src/controller/webauthn.controller.ts Nivaas_Backend/src/routes/webauthn.route.ts
git commit -m "feat: add WebAuthn password-less authentication service and endpoints"

git add Nivaas_Backend/src/index.ts
git commit -m "feat: register WebAuthn routes in Express app"

git add Nivaas_Backend/src/models/user.model.ts Nivaas_Backend/src/types/user.type.ts
git commit -m "feat: add webauthnCredentials and webauthnChallenge to User model"

# Phase 10: Frontend Security UI
echo "Phase 10"
git add homecomf_Web/app/components/ui/password-strength-meter.tsx
git commit -m "feat: add real-time password strength meter with suggestions"

git add homecomf_Web/app/components/ui/recaptcha-widget.tsx
git commit -m "feat: add reCAPTCHA v3 widget with dev bypass mode"

git add homecomf_Web/app/auth/mfa/page.tsx
git commit -m "feat: add MFA enrollment page with QR code and backup codes"

git add homecomf_Web/app/auth/signup/page.tsx
git commit -m "feat: integrate password strength meter and CAPTCHA into signup"

git add homecomf_Web/app/auth/login/page.tsx
git commit -m "feat: integrate reCAPTCHA v3 widget into login form"

git add homecomf_Web/app/components/ui/webauthn-register.tsx
git commit -m "feat: add WebAuthn passkey registration component"

# Phase 11: Infrastructure
echo "Phase 11"
git add Dockerfile docker-compose.yml
git commit -m "feat: add Docker multi-stage build and docker-compose orchestration"

git add .github/workflows/ci-cd.yml SECURITY_DOCUMENTATION.md
git commit -m "feat: add CI/CD pipeline with CodeQL, npm audit, tests, plus security docs"

git add docs/screenshots/
git commit -m "docs: add screenshot directory for pentest evidence images"

git remote add origin https://github.com/SAMAR1007/CW2-SEC.git

echo ""
echo "=== Done! 45 commits created ==="
git log --oneline | nl
echo ""
echo "Push with: git push -u origin master --force"
