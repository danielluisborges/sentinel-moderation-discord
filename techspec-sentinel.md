# Techspec — Sentinel

Bot de moderação para Discord com painel web de administração.

## 1. Visão geral

**Sentinel** é um bot de moderação em TypeScript com três pilares:

1. **Moderação**: comandos restritos a mods (ban, kick, timeout, warn, clear) e comandos livres para todos (ping, userinfo).
2. **IA**: o comando `/prompt` responde perguntas usando a API gratuita do Gemini, sem busca na web.
3. **Painel web**: admins fazem login com Discord e controlam o servidor: moderação, canais e categorias com drag and drop, configurações.

**Princípio central:** tudo que o bot faz, o painel faz. Por isso a lógica fica numa camada de `services/`. Comandos e rotas HTTP são só "portas de entrada" finas que chamam o mesmo service.

**Restrições:**
- Sem banco de dados pago. Histórico de ações vai para os canais de log dos diretores.
- Hospedagem provável: Discloud.
- TypeScript no bot e no painel.

## 2. Decisões

| Tema | Decisão |
|---|---|
| Linguagem | TypeScript (strict) |
| Biblioteca do bot | discord.js (oficial) |
| IA | Gemini, SDK oficial `@google/genai` |
| Repositório | Monorepo simples: bot e painel no mesmo repo, tipos compartilhados |
| Servidor web | Roda no mesmo processo do bot |
| Sessão do painel | Cookie httpOnly assinado (JWT), sem sessão em memória |
| Persistência | Interface `ConfigStore` com implementação trocável (ver seção 6) |

**Em aberto (precisam da sua resposta antes da fase indicada):**
- Onde guardar a config: canal privado do Discord ou JSON local (antes da Fase 2).
- Como a Discloud trata disco, porta e domínio do site (antes da Fase 8).
- Cota atual do Gemini gratuito, para definir o cooldown (antes da Fase 4).

## 3. Stack e bibliotecas

Confira a versão mais recente de cada uma na hora de instalar e fixe no `package.json`.

### Bot e backend

| Biblioteca | Para quê |
|---|---|
| `discord.js` | Cliente do Discord, slash commands, eventos, REST |
| `typescript`, `@types/node` | Linguagem e tipos |
| `tsx` | Rodar e dar watch em TS no desenvolvimento |
| `zod` | Validar variáveis de ambiente e todo corpo de requisição da API |
| `dotenv` | Carregar `.env` em desenvolvimento |
| `pino` (+ `pino-pretty` no dev) | Log técnico do processo (diferente dos logs de moderação nos canais) |
| `@google/genai` | SDK oficial do Gemini |
| `express` | Servidor HTTP da API e do build estático do painel |
| `cookie-parser` | Ler cookies |
| `jose` | Assinar e verificar o JWT da sessão |
| `helmet` | Cabeçalhos de segurança |
| `express-rate-limit` | Limitar abuso na API |
| `vitest` | Testes dos services |
| `eslint`, `typescript-eslint`, `prettier` | Qualidade de código |

### Painel (`panel/`)

| Biblioteca | Para quê |
|---|---|
| `react`, `react-dom`, `vite`, `typescript` | Base do frontend |
| `react-router-dom` | Rotas (Servidores, Membros, Bans, Canais, Config) |
| `@tanstack/react-query` | Cache e mutações das chamadas à API |
| `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` | Drag and drop da árvore de canais |
| `tailwindcss` | Estilo |
| `lucide-react` | Ícones (texto, voz, categoria) |

## 4. Estrutura de pastas

```
sentinel/
├── src/
│   ├── index.ts                 # sobe o client e o servidor web
│   ├── client.ts                # instância do Client + intents
│   ├── env.ts                   # valida variáveis de ambiente com zod
│   ├── handlers/
│   │   ├── commands.ts          # carrega commands/ automaticamente
│   │   └── events.ts            # carrega events/ automaticamente
│   ├── commands/
│   │   ├── moderation/          # ban, kick, timeout, warn, clear (só mods)
│   │   ├── utility/             # ping, userinfo (todos)
│   │   └── ai/
│   │       └── prompt.ts        # /prompt
│   ├── events/                  # ready, interactionCreate, guildMemberAdd...
│   ├── services/                # o coração: lógica reutilizável
│   │   ├── moderation.service.ts
│   │   ├── channels.service.ts
│   │   ├── logger.service.ts    # envia logs aos canais dos diretores
│   │   ├── config.service.ts    # lê e grava a config do servidor
│   │   └── ai.service.ts
│   ├── ai/
│   │   ├── gemini.ts            # cliente Gemini
│   │   └── systemPrompt.ts      # personalidade e regras do Sentinel
│   ├── storage/
│   │   ├── ConfigStore.ts       # interface
│   │   ├── discordChannelStore.ts
│   │   └── jsonFileStore.ts
│   ├── utils/                   # permissions, embeds, chunkMessage, cooldown
│   ├── types/
│   │   ├── command.ts           # interface Command
│   │   └── config.ts            # GuildConfig
│   ├── shared/                  # DTOs usados pelo bot E pelo painel
│   │   └── dto.ts               # MemberDTO, BanRequest, ChannelNode...
│   └── web/
│       ├── server.ts
│       ├── auth/                # OAuth2 do Discord, emissão do JWT
│       ├── middleware/          # requireAuth, requireGuildAdmin
│       └── routes/              # guilds, members, bans, channels, config
├── panel/                       # React + Vite + TS (importa de ../src/shared)
│   └── src/
│       ├── api/                 # funções de chamada + hooks do TanStack Query
│       ├── components/          # ChannelTree, MemberTable, BanDialog
│       ├── pages/
│       └── main.tsx
├── scripts/
│   └── deploy-commands.ts       # registra os slash commands
├── tests/
├── tsconfig.json
├── package.json
├── discloud.config              # preenchido na Fase 8
└── .env
```

**Regras de dependência:**
- `commands/` e `web/routes/` podem importar `services/`. Nunca o contrário.
- `services/` recebem o `Guild` ou o `Client` e quem executou como parâmetros. Não conhecem Express nem interações.
- `shared/` não importa nada do discord.js. Só tipos puros.

## 5. Fluxos principais

### Comando de mod (ex.: `/ban`)
1. O comando usa `setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)`, e o Discord esconde de quem não tem.
2. No `execute`, checa também o cargo de mod configurado (permissões do Discord podem ser alteradas pelo admin).
3. Chama `moderationService.ban({ guild, targetId, executor, reason, source: 'command' })`.
4. O service valida hierarquia (cargo do bot e de quem executa acima do alvo), aplica o ban e chama o `loggerService`.

### Ban pelo painel
1. Admin busca o membro: `GET /api/guilds/:id/members?query=ana`, que usa `guild.members.search({ query, limit: 20 })`.
2. O backend devolve só `MemberDTO` (id, username, avatar, cargos, entrada).
3. Admin confirma: `POST /api/guilds/:id/bans`, validado com zod.
4. A rota chama o **mesmo** `moderationService.ban(...)` com `source: 'panel'`.
5. O log aparece no canal dos diretores como "Banido por @fulano (via painel)".

O service aceita ID, pois dá para banir quem já saiu. A aba Banidos usa `guild.bans.fetch()` para desbanir.

### `/prompt` (IA)
1. `deferReply()` imediatamente.
2. Cooldown por usuário.
3. `aiService.ask(userId, text)` chama o Gemini com o `systemPrompt`.
4. A resposta é quebrada em blocos de até 2000 caracteres (`chunkMessage`) e enviada em `followUp`.

### Árvore de canais com drag and drop
1. `GET /api/guilds/:id/channels` devolve uma árvore `ChannelNode` (categorias com filhos).
2. No painel, `@dnd-kit` permite reordenar canais e mover entre categorias.
3. Ao soltar, o front acumula as mudanças e envia em **lote** uma lista de `{ id, position, parentId }`.
4. O `channelsService` aplica com `guild.channels.setPositions()`, que também troca a categoria pai.
5. Criar, renomear e apagar canais passam pelo mesmo service, com log nos canais dos diretores.

O Discord tem rate limit forte em edição de canais, então nada de uma requisição por movimento. O bot precisa da permissão **Gerenciar Canais**.

## 6. Persistência sem banco

O que precisa persistir: canal de log, cargo de mod, contagem de warns (se houver punição progressiva), configurações da IA.

```ts
export interface ConfigStore {
  getGuildConfig(guildId: string): Promise<GuildConfig>;
  saveGuildConfig(guildId: string, config: GuildConfig): Promise<void>;
}
```

O resto do código só conhece essa interface. Duas implementações:

- **`jsonFileStore`**: um arquivo por servidor. Simples, mas só serve se a hospedagem mantiver o disco entre deploys. Isso precisa ser confirmado na documentação da Discloud antes de apostar.
- **`discordChannelStore`**: guarda o JSON como **anexo** de uma mensagem fixada num canal privado (`#sentinel-config`). Use anexo, e não texto, porque mensagens de texto têm limite de 2000 caracteres. Para atualizar, edita a mensagem trocando o anexo, ou apaga e reenvia. Sobrevive a qualquer deploy ou troca de host. É mais lento e depende da API do Discord, mas a config é pequena e lida poucas vezes (use cache em memória).

Plano: começar com o `jsonFileStore` para desenvolver, e decidir o definitivo na Fase 2.

## 7. Segurança

- Token do bot, client secret e chave do Gemini só em variáveis de ambiente. Nunca no repositório.
- OAuth2 com escopos mínimos: `identify` e `guilds`.
- Em **toda** rota de servidor, o backend confere: usuário logado, usuário tem Gerenciar Servidor ou Administrador naquele servidor, e o bot está nele. O frontend nunca é fonte de verdade.
- Validar todo input com zod. Checar hierarquia de cargos dentro dos services.
- Rate limit na API, `helmet`, cookie `httpOnly`, `secure` e `sameSite`.
- O `systemPrompt` impede o Sentinel de executar ações de moderação por pedido de texto. A IA responde, nunca modera.
- Intents: `Guilds`, `GuildMembers` (privilegiada, ligar no Developer Portal), `GuildModeration`. Evitar `MessageContent` a menos que seja realmente necessário.

## 8. Variáveis de ambiente

```
DISCORD_TOKEN=
DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=
DISCORD_REDIRECT_URI=
DEV_GUILD_ID=          # registrar comandos rapidamente num servidor de teste
GEMINI_API_KEY=
JWT_SECRET=
PORT=
PANEL_URL=
CONFIG_STORE=json|channel
```

## 9. Protocolo de execução (regras para o agente)

Este documento é executado **fase por fase, com autorização explícita**.

1. Executar somente a fase autorizada. Nunca adiantar trabalho de fases seguintes.
2. Antes de começar uma fase, listar os arquivos que serão criados ou alterados e as dependências a instalar.
3. Ao terminar, entregar: resumo do que foi feito, como testar, resultado dos critérios de aceite, e pendências ou dúvidas.
4. **Parar e aguardar** a mensagem do Daniel autorizando a próxima fase.
5. Se algo na spec estiver ambíguo ou conflitar com a realidade (API mudou, limite diferente), perguntar em vez de assumir.
6. Nunca colocar segredos no código. Nunca instalar dependência fora da lista sem avisar.

**Regra do token:** o agente grava token, client secret e chave do Gemini apenas no `.env` (que fica no `.gitignore`). Nunca em código, commits, logs, mensagens de erro, testes ou exemplos, e nunca repete o valor de volta no chat. Se algum segredo aparecer fora do `.env`, o agente avisa na hora para o Daniel regenerar.

## 10. Fases

### Fase 0: Preparação (concluída)
- Criar a aplicação e o bot no Developer Portal.
- Ligar o **Server Members Intent**.
- Criar um servidor de teste e convidar o bot (escopos `bot` e `applications.commands`, com Administrador no teste).
- Anotar token, client id e client secret.

**Pronto quando:** o bot aparece (offline) no servidor de teste.

**Status:** feita pelo Daniel. O token do bot (e, quando existirem, client id e client secret) será enviado ao agente no chat. O agente grava os valores só no `.env` e o Daniel regenera o token no Developer Portal depois, atualizando o `.env`.

### Fase 1: Base do projeto
- Repositório, `package.json`, `tsconfig` strict, ESLint, Prettier, `tsx`.
- `env.ts` com zod, `client.ts`, `handlers/` automáticos, `types/command.ts`.
- `scripts/deploy-commands.ts` e o comando `/ping`.

**Aceite:** `npm run dev` sobe o bot online, `/ping` responde, e falta de variável de ambiente gera erro claro.

### Fase 2: Config e storage
- Interface `ConfigStore`, `GuildConfig` e `config.service` com cache.
- Implementação `jsonFileStore` e, se decidido, `discordChannelStore`.
- Comando `/config` (só admin) para definir canal de log e cargo de mod.

**Aceite:** a config persiste após reiniciar o bot.

### Fase 3: Moderação e logs
- `logger.service` (embeds nos canais dos diretores) e `utils/permissions`.
- `moderation.service` com ban, unban, kick, timeout, warn e clear, incluindo validação de hierarquia.
- Comandos correspondentes em `commands/moderation/`, mais `userinfo` em `utility/`.
- Testes do service com vitest.

**Aceite:** cada ação funciona, registra log com executor e motivo, e é bloqueada quando o alvo tem cargo acima.

### Fase 4: Módulo de IA
- `gemini.ts`, `systemPrompt.ts`, `ai.service` e `/prompt`.
- `deferReply`, divisão em blocos de 2000 caracteres, cooldown por usuário, tratamento de erro e de cota esgotada.

**Aceite:** respostas longas chegam completas em várias mensagens, o cooldown funciona, e o erro de cota gera mensagem amigável.

### Fase 5: API e autenticação
- Servidor Express no mesmo processo, `helmet`, rate limit.
- Login OAuth2, JWT em cookie, `requireAuth` e `requireGuildAdmin`.
- Rotas `GET /api/guilds` (servidores onde o usuário é admin e o bot está).

**Aceite:** login funciona, e um usuário sem permissão recebe 403 em qualquer rota do servidor.

### Fase 6: Painel, parte 1 (leitura e moderação)
- Projeto `panel/` com Vite, React, Router, Tailwind e TanStack Query.
- Páginas: seleção de servidor, Membros (busca), Banidos (listar e desbanir), formulário de ban.
- Rotas de members e bans chamando o `moderationService`.
- `src/shared` com os DTOs.

**Aceite:** banir e desbanir pelo painel gera o mesmo log do `/ban`, marcado como "via painel".

### Fase 7: Canais com drag and drop
- `channels.service`: listar em árvore, criar, renomear, apagar e reordenar em lote.
- Componente `ChannelTree` com `@dnd-kit`, mover entre categorias, botão "Salvar alterações" que envia o lote.

**Aceite:** reorganizar no painel reflete no Discord, e uma reorganização grande não estoura o rate limit.

### Fase 8: Deploy
- Build do painel servido pelo próprio Express.
- `tsc` gerando `dist/`, `discloud.config` com `MAIN=dist/index.js`.
- Verificar na documentação da Discloud: persistência de disco, porta e domínio do site, redirect URI do OAuth2 em produção.

**Aceite:** bot e painel funcionam em produção e a config sobrevive a um novo deploy.

### Fase 9: Acabamento (opcional)
- Auto-moderação simples (anti-spam, links), punição progressiva por warns, welcome, histórico de ações no painel.

## 11. Riscos e pontos de atenção

- **Cota do Gemini gratuito:** muda com o tempo. Conferir limites atuais antes de definir o cooldown.
- **Rate limit do Discord** em edição de canais e em ban em massa: sempre em lote e com tratamento de erro.
- **Persistência na Discloud:** não assumir. Confirmar antes de depender de arquivo local.
- **Hierarquia de cargos:** a causa mais comum de falha de moderação. O cargo do bot precisa estar acima dos cargos que ele deve moderar.
- **Intent privilegiada:** acima de 100 servidores o Discord exige verificação. Não deve ser problema agora.
