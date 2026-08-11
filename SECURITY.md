# SECURITY.md — Casa do 7

## Decisões de Segurança e Privacidade

Este documento registra todas as decisões de segurança e conformidade com a LGPD do projeto Casa do 7. **Nenhuma funcionalidade nova deve ser implementada sem que os controles descritos aqui estejam em vigor.**

---

## 1. Proteção de Lógica de Negócio

- **Toda regra de preço, estoque, desconto e pagamento é validada e recalculada no servidor.**
- O frontend nunca envia valores de preço/desconto para o backend — apenas IDs de produto, variante e cupom.
- O servidor recalcula subtotal, desconto e total a cada requisição de checkout.
- Schemas Zod validam todos os inputs tanto no client (UX) quanto no server (segurança).

## 2. Controle de Acesso por Papel (RBAC)

- **Roles definidas**: `CUSTOMER`, `ADMIN`, `STAFF` (enum no banco de dados).
- **Middleware de borda** (`middleware.ts`) intercepta toda requisição a `/gestao/*`:
  - Verifica existência de sessão válida (cookie httpOnly).
  - Verifica se o usuário possui role `ADMIN` ou `STAFF`.
  - Retorna 403 ou redireciona para login admin em caso de falha.
- **A área administrativa (`/gestao`) não é linkada, indexada (`noindex, nofollow`) nem referenciada em nenhum lugar do frontend público.**
- Verificação de role é feita **a cada requisição no servidor**, nunca apenas no client.

## 3. Autenticação

- **Auth.js v5 (NextAuth)** com sessões baseadas em JWT armazenados em cookies `httpOnly`, `Secure`, `SameSite=Lax`.
- **Nenhum token sensível é armazenado em `localStorage` ou `sessionStorage`.**
- Senhas hashadas com **bcrypt** (cost factor 12).
- Login de admin: Credentials provider (e-mail + senha).
- Login de cliente: Google OAuth + Credentials provider.

## 4. Criptografia

- **HTTPS obrigatório** em todos os ambientes (enforced via headers HSTS).
- **Senhas**: bcrypt com cost factor 12.
- **Dados sensíveis em repouso** (CPF, telefone quando necessário): criptografia AES-256-GCM via utility functions dedicadas, com chave em variável de ambiente (`ENCRYPTION_KEY`).
- **Segredos e chaves de API**: exclusivamente em variáveis de ambiente do servidor, nunca em código versionado, nunca prefixadas com `NEXT_PUBLIC_`.

## 5. Proteção contra Ataques Comuns

### Rate Limiting
- Rotas de login: máximo 5 tentativas por IP em janela de 15 minutos.
- Rotas de checkout: máximo 10 requisições por sessão em janela de 5 minutos.
- Implementado via middleware ou biblioteca como `rate-limiter-flexible`.

### CSRF
- Proteção nativa do Next.js via Server Actions (token CSRF automático).
- Para API Routes: validação de `Origin`/`Referer` header.

### Validação de Input
- **Zod** em toda boundary de dados:
  - Client: feedback imediato ao usuário.
  - Server: validação autoritativa antes de qualquer operação de banco.
- Sanitização de strings para prevenir XSS (DOMPurify no client, escape no server).

### Headers de Segurança (configurados em `next.config.ts`)
```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data: https:; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https:;
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

## 6. LGPD — Lei Geral de Proteção de Dados

### 6.1 Base Legal por Dado Coletado

| Dado | Base Legal | Finalidade |
|------|-----------|------------|
| Nome, e-mail, telefone, endereço | Execução do contrato (Art. 7, V) | Processar e entregar o pedido |
| CPF | Obrigação legal (Art. 7, II) | Emissão de nota fiscal |
| E-mail/WhatsApp para marketing | Consentimento explícito (Art. 7, I) | Envio de promoções e ofertas |
| Cookies de analytics | Consentimento explícito (Art. 7, I) | Análise de comportamento no site |
| Dados de navegação | Interesse legítimo (Art. 7, IX) | Melhoria da experiência |

### 6.2 Consentimentos

- **Opt-in de marketing é separado e não pré-marcado** — checkbox específico para:
  - Promoções por e-mail
  - Promoções por WhatsApp
- **Opt-in operacional** (avisos sobre pedido) é distinto e baseado em execução do contrato.
- Cada consentimento é registrado no banco com timestamp, IP e user agent.
- Consentimento pode ser revogado a qualquer momento pela área "Meus Dados" do cliente.

### 6.3 Direitos do Titular

- **Acesso**: Cliente pode visualizar todos os seus dados na área "Meus Dados".
- **Exportação**: Botão "Exportar meus dados" gera JSON com todos os dados do titular.
- **Exclusão**: Botão "Solicitar exclusão dos meus dados" inicia processo de anonimização.
- **Retificação**: Cliente pode editar seus dados cadastrais a qualquer momento.

### 6.4 Banner de Cookies

- Exibido na primeira visita, com opções reais:
  - "Aceitar todos"
  - "Aceitar apenas essenciais"
  - "Personalizar" (com toggles por categoria)
- Cookies não essenciais **não são carregados** até consentimento explícito.
- Preferência salva em cookie essencial (`cookie_consent`).

### 6.5 Auditoria

- **AuditLog** registra toda ação administrativa sobre dados de clientes:
  - Visualização de dados de cliente
  - Exportação de dados
  - Alteração de dados
- Campos: userId (admin), ação, entidade, entityId, IP, timestamp.
- Logs não podem ser alterados ou excluídos por nenhum usuário.

## 7. Política de Privacidade e Termos de Uso

- Links visíveis no **rodapé de todas as páginas** e no **checkout**.
- Texto próprio (não template genérico), adequado ao negócio.
- Versão datada, com histórico de alterações.

## 8. Variáveis de Ambiente

### Sensíveis (apenas servidor — NUNCA `NEXT_PUBLIC_`)
```
DATABASE_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
MERCADOPAGO_ACCESS_TOKEN=
MERCADOPAGO_PUBLIC_KEY=         # Esta é a exceção — necessária no client para SDK
WHATSAPP_API_TOKEN=
ENCRYPTION_KEY=
```

### Segregação por Ambiente
- `.env.local` — desenvolvimento local (gitignored)
- `.env.staging` — staging (Vercel environment)
- `.env.production` — produção (Vercel environment)
- `.env.example` — template sem valores reais (versionado)
