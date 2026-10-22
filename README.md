# Sentinel

Bot de moderação para Discord com um painel web para administrar servidores, membros, canais e automações.

O Sentinel combina slash commands com uma API e um painel React no mesmo projeto. As operações de moderação passam pelo backend, que verifica permissões e registra ações no canal privado de logs configurado para o servidor.

> O Sentinel é um projeto independente e não é afiliado ao Discord.

## Índice

- [Recursos](#recursos)
- [Tecnologias](#tecnologias)
- [Requisitos](#requisitos)
- [Configuração do Discord](#configuração-do-discord)
- [Instalação local](#instalação-local)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Comandos](#comandos)
- [Painel web](#painel-web)
- [Logs e privacidade](#logs-e-privacidade)
- [Deploy](#deploy)
- [Desenvolvimento](#desenvolvimento)
- [Licença](#licença)

## Recursos

### Bot Discord

- Moderação por slash commands: banimento, expulsão, avisos, limpeza de mensagens e timeout.
- Consulta de informações públicas de usuários e verificação de disponibilidade.
- Comando `/prompt` com Gemini e opção de fallback para DeepSeek.
- Mensagens de boas-vindas e de saída configuráveis.
- Registro de entradas, saídas, mensagens apagadas e ações administrativas no canal privado de logs.
- Configuração do cargo de moderador e do canal de logs por `/config`.

### Painel web

- Login com OAuth2 do Discord.
- Acesso limitado a servidores em que a pessoa tem permissão de Administrador ou Gerenciar Servidor e onde o Sentinel está instalado.
- Visão geral, busca de membros, ações de moderação e gerenciamento de banimentos.
- Criação, edição, exclusão e reorganização de canais e categorias.
- Criação de estruturas de canais com IA: a prévia aparece como uma árvore visual de categorias e canais; nada é criado até a confirmação.
- Criação de cargos e gerenciamento dos cargos atribuídos a membros.
- Configuração de comandos, canal/cargo de moderação e mensagens automáticas.
- Interface responsiva, tema claro/escuro, ícones Lucide e notificações toast.

O Sentinel não executa ações de moderação por meio de conversa com a IA. O comando `/prompt` responde perguntas; a criação de estrutura de canais exige revisão e confirmação no painel.

## Tecnologias

- Node.js, TypeScript e discord.js
- Express, Zod, Pino e JWT
- React, Vite, Tailwind CSS e TanStack Query
- Gemini via `@google/genai`, com fallback opcional para a API da DeepSeek
- Armazenamento local das configurações em arquivos JSON

## Requisitos

- Node.js **20.19+** ou **22.12+**
- npm
- Uma aplicação e um bot criados no [Discord Developer Portal](https://discord.com/developers/applications)
- Uma chave da API Gemini para os recursos de IA; uma chave DeepSeek é opcional

## Configuração do Discord

### 1. Criar a aplicação e o bot

No Developer Portal, crie uma aplicação, adicione um bot e copie o token para o arquivo `.env`. O token do bot é diferente do client secret do OAuth.

Em **Bot → Privileged Gateway Intents**, habilite:

- **Server Members Intent**: lista de membros e eventos de entrada/saída.
- **Message Content Intent**: captura de conteúdo de mensagens para registrar exclusões.

Presence Intent não é necessário.

### 2. Configurar o OAuth do painel

Em **OAuth2 → General**, adicione a URL de callback à lista de Redirects:

```text
http://localhost:3000/auth/discord/callback
```

Para produção, adicione também a URL pública, por exemplo:

```text
https://SEU_DOMINIO/auth/discord/callback
```

As URLs devem corresponder exatamente ao valor de `DISCORD_REDIRECT_URI`, incluindo protocolo, domínio, caminho e porta.

Use o **Client ID** e o **Client Secret** da mesma aplicação nos campos `DISCORD_CLIENT_ID` e `DISCORD_CLIENT_SECRET`. O login solicita somente os escopos `identify` e `guilds`.

### 3. Convidar o bot

Gere um link de instalação para a aplicação com os escopos:

- `bot`
- `applications.commands`

Conceda somente as permissões necessárias ao que pretende usar. Em geral:

- Ver canais, enviar mensagens, incorporar links, anexar arquivos e ler histórico.
- Ver registro de auditoria para tentar identificar moderadores responsáveis por ações.
- Gerenciar canais.
- Gerenciar mensagens.
- Banir, expulsar e aplicar timeout, se for usar esses recursos.
- Gerenciar cargos, se for usar criação e atribuição de cargos pelo painel.

Não é necessário conceder Administrador ao bot. Mantenha o cargo do Sentinel acima dos cargos que ele precisa administrar. As ações ainda dependem das regras de hierarquia e permissões do próprio Discord.

### 4. Ativar as permissões e configurar o cargo de moderação

Há dois cargos diferentes nesta configuração: o cargo de integração **Sentinel**, usado pelo bot, e um cargo humano, como **Moderador**, usado pela equipe. Configurar um deles não substitui o outro.

#### Permissões do cargo Sentinel

No servidor, abra **Configurações do servidor → Cargos → Sentinel → Permissões**. Ative as permissões necessárias para os recursos que pretende usar. Para o conjunto completo de recursos documentados neste projeto, confira especialmente:

- **Ver canais**, **Enviar mensagens**, **Incorporar links**, **Anexar arquivos** e **Ler histórico de mensagens** para comandos, respostas e registros.
- **Ver registro de auditoria** para tentar identificar quem executou ações no servidor.
- **Gerenciar canais** para criar, editar e excluir canais pelo painel e criar estruturas de canais.
- **Gerenciar cargos** para criar cargos e atribuí-los pelo painel.
- **Banir membros**, **Expulsar membros** e **Moderar membros** para os respectivos comandos de moderação.
- **Gerenciar mensagens** para o comando de limpeza e recursos relacionados.

Ative as permissões que deseja disponibilizar e salve as alterações. Coloque o cargo Sentinel acima dos cargos que ele precisa gerenciar. Não é necessário ativar **Administrador**. O Discord impede o bot de administrar cargos que estejam acima ou no mesmo nível do cargo Sentinel, além de aplicar outras regras de hierarquia.

#### Cargo humano de moderador

1. Em **Configurações do servidor → Cargos**, crie ou escolha um cargo para a equipe, por exemplo, **Moderador**.
2. Atribua esse cargo às pessoas que devem ter acesso aos recursos de moderação.
3. No Discord, em um canal do servidor, digite `/config` e selecione o comando **cargo-mod**.
4. No campo de cargo, escolha o cargo humano **Moderador** e envie o comando.

O `/config cargo-mod` informa ao Sentinel qual cargo humano deve ter acesso aos canais privados de moderação criados pelo bot. Ele não concede permissões do Discord por conta própria e não substitui as permissões do cargo Sentinel. Portanto, selecione **Moderador** (ou o cargo equivalente da sua equipe), e não o cargo de integração **Sentinel**.

O comando `/config cargo-mod` exige que quem o executa tenha permissão de Administrador no servidor. Administradores continuam com acesso independentemente do cargo configurado.

#### Canal privado de logs

O Sentinel pode preparar automaticamente um canal privado de logs quando precisar registrar uma ação. Também é possível escolher um canal de texto existente na página **Configurações** do painel. Verifique as permissões do canal para que `@everyone` não consiga visualizá-lo e conceda acesso ao Sentinel e à equipe apropriada. Os registros dependem de o bot ter as permissões necessárias e de o evento fornecer os dados correspondentes; o registro de auditoria do Discord pode não identificar o responsável em todos os casos.

### 5. Registro dos slash commands

Com o bot ligado, o Sentinel registra os slash commands automaticamente ao conectar e também quando entra em um novo servidor. Normalmente, não é preciso alterar um ID de servidor no `.env` nem executar um comando manual para cada servidor.

Se os comandos não aparecerem após convidar o bot, confira se o link de instalação incluiu os escopos `bot` e `applications.commands`, confirme que o bot está online e aguarde a atualização do Discord. No painel, também é possível usar **Configurações → Comandos do Discord → Registrar comandos** para solicitar o registro novamente.

O script manual `npm run deploy-commands` continua disponível para desenvolvimento. `DEV_GUILD_ID` (ou, como alternativa, `SERVER_ID`) limita o registro manual ao servidor indicado, o que costuma atualizar mais rápido durante testes. Sem esses valores, o script registra comandos globalmente, cuja propagação pode levar mais tempo.

## Instalação local

Clone o repositório e instale as dependências:

```bash
git clone https://github.com/SEU_USUARIO/sentinel.git
cd sentinel
npm ci
```

Crie o arquivo de ambiente a partir do exemplo:

```bash
cp .env.example .env
```

No PowerShell:

```powershell
Copy-Item .env.example .env
```

Preencha o `.env` conforme a seção [Variáveis de ambiente](#variáveis-de-ambiente). O registro automático dos slash commands ocorre quando o bot inicia e quando entra em um servidor. Para registrar manualmente durante o desenvolvimento, configure `DEV_GUILD_ID` com o ID do servidor de teste e execute:

```bash
npm run deploy-commands
```

Inicie o bot e a API em um terminal:

```bash
npm run dev
```

Inicie o painel em outro terminal:

```bash
npm run panel:dev
```

Abra [http://localhost:5173](http://localhost:5173) e entre com o Discord. O Vite encaminha as rotas `/api` e `/auth` para o backend local em `http://localhost:3000`.

## Variáveis de ambiente

O arquivo `.env.example` contém o modelo. Não envie `.env`, tokens ou chaves para o GitHub.

| Variável                   | Obrigatória                    | Uso                                                                                                                            |
| -------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| `DISCORD_TOKEN`            | Sim                            | Token do bot.                                                                                                                  |
| `DISCORD_CLIENT_ID`        | Para OAuth                     | Client ID da aplicação Discord. Também é usado ao registrar comandos; se omitido, o script tenta obter o ID pelo token do bot. |
| `DISCORD_CLIENT_SECRET`    | Para OAuth                     | Client Secret da aplicação Discord.                                                                                            |
| `DISCORD_REDIRECT_URI`     | Para OAuth                     | Callback registrado no Developer Portal. No local: `http://localhost:3000/auth/discord/callback`.                              |
| `DEV_GUILD_ID`             | Recomendada no desenvolvimento | Registra slash commands somente no servidor de teste.                                                                          |
| `SERVER_ID`                | Opcional                       | ID de servidor usado como alternativa a `DEV_GUILD_ID` pelo script de registro.                                                |
| `GEMINI_API_KEY`           | Para Gemini                    | Chave da API do Gemini.                                                                                                        |
| `AI_PROVIDER`              | Não                            | Provedor principal. O valor padrão é `gemini`.                                                                                 |
| `AI_FALLBACK_PROVIDER`     | Não                            | Identificador do modelo DeepSeek alternativo. Para DeepSeek V4.1 Flash, use `deepseek-ai/DeepSeek-V4.1-Flash`.                 |
| `AI_FALLBACK_KEY`          | Se usar fallback               | Chave de API da DeepSeek.                                                                                                      |
| `JWT_SECRET`               | Para login                     | Segredo com pelo menos 32 bytes para assinar sessões.                                                                          |
| `PORT`                     | Não                            | Porta HTTP; padrão local: `3000`.                                                                                              |
| `NODE_ENV`                 | Não                            | Use `development` localmente e `production` no deploy.                                                                         |
| `SESSION_DURATION_MINUTES` | Não                            | Duração da sessão do painel, de 1 a 120 minutos; padrão: 10.                                                                   |
| `PANEL_URL`                | Recomendada                    | URL para a qual o Discord redireciona após o login. Local: `http://localhost:5173`.                                            |
| `CONFIG_STORE`             | Não                            | Mantenha `json`; atualmente as configurações são armazenadas em arquivos JSON locais.                                          |

Para gerar um segredo JWT localmente:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Exemplo mínimo para desenvolvimento:

```dotenv
DISCORD_TOKEN=seu_token_do_bot
DISCORD_CLIENT_ID=id_da_aplicacao
DISCORD_CLIENT_SECRET=client_secret_da_aplicacao
DISCORD_REDIRECT_URI=http://localhost:3000/auth/discord/callback
DEV_GUILD_ID=id_do_servidor_de_teste
GEMINI_API_KEY=sua_chave_gemini
AI_PROVIDER=gemini
AI_FALLBACK_PROVIDER=deepseek-ai/DeepSeek-V4.1-Flash
AI_FALLBACK_KEY=sua_chave_deepseek
JWT_SECRET=gere_um_segredo_com_ao_menos_32_bytes
PORT=3000
NODE_ENV=development
SESSION_DURATION_MINUTES=10
PANEL_URL=http://localhost:5173
CONFIG_STORE=json
```

As chaves de IA são usadas somente pelo backend. Em caso de falha temporária do provedor principal, o Sentinel tenta novamente e usa o fallback configurado. O identificador `deepseek-ai/DeepSeek-V4.1-Flash` é convertido para o nome de modelo aceito pela API hospedada da DeepSeek.

## Comandos

| Comando              | O que faz                                                  |
| -------------------- | ---------------------------------------------------------- |
| `/ping`              | Verifica se o bot está respondendo.                        |
| `/userinfo`          | Mostra informações públicas de um usuário.                 |
| `/ban`               | Bane pelo ID do usuário, mesmo que ele já tenha saído.     |
| `/unban`             | Remove um banimento pelo ID.                               |
| `/kick`              | Expulsa um membro.                                         |
| `/timeout`           | Aplica timeout por uma duração definida.                   |
| `/warn`              | Registra um aviso.                                         |
| `/clear`             | Apaga até 100 mensagens recentes.                          |
| `/prompt`            | Faz uma pergunta à IA, se ela estiver ativada no servidor. |
| `/config canal-logs` | Define o canal privado usado para logs.                    |
| `/config cargo-mod`  | Define o cargo de moderador do Sentinel.                   |

Os slash commands podem ser registrados em um servidor de desenvolvimento com `DEV_GUILD_ID`. Sem esse valor, o script tenta usar `SERVER_ID`; se ambos estiverem vazios, registra os comandos globalmente.

## Painel web

Após o login, o painel lista os servidores em que a pessoa tem permissão de Administrador ou Gerenciar Servidor e que também têm o Sentinel instalado. O backend repete essa verificação em todas as rotas; a interface não é considerada uma camada de autorização.

Para configurar os logs, escolha um canal privado em **Configurações** ou use `/config canal-logs`. O Sentinel pode criar automaticamente `#sentinel-logs` quando precisar registrar uma ação e ainda não houver um canal configurado.

Para criar canais privados para moderadores, defina primeiro o cargo em **Configurações → Moderação** ou use `/config cargo-mod`. Canais de anúncio também dependem dos recursos habilitados no servidor Discord; a geração da estrutura usa canais de texto comuns quando anúncios não estão disponíveis.

## Logs e privacidade

- O Sentinel envia registros de moderação e administração ao canal privado configurado. Garanta que esse canal seja visível somente para as pessoas autorizadas.
- Para mensagens apagadas, o conteúdo e anexos são mantidos temporariamente em memória: até 10.000 mensagens por processo, com expiração de uma hora. O registro pode ficar incompleto se o Sentinel não recebeu a mensagem antes da exclusão ou se o processo reiniciou.
- O Discord pode não informar quem apagou uma mensagem. A identificação depende do Audit Log e da permissão **Ver registro de auditoria**.
- O Sentinel não grava conversas do comando `/prompt` em banco próprio. O texto enviado à IA é processado pelo provedor configurado (Gemini ou DeepSeek); consulte as políticas do provedor antes de habilitar o recurso para sua comunidade.
- As configurações do servidor ficam em `data/guilds/<ID_DO_SERVIDOR>.json`. A pasta `data/` não deve ser versionada e precisa estar em armazenamento persistente no host.
- As sessões de login são mantidas em memória. Após reiniciar o processo, usuários podem precisar entrar novamente.

## Deploy

O projeto já inclui `discloud.config`. O fluxo configurado é:

```text
Build: npm run build
Start: npm run start
```

Configure as variáveis de ambiente no painel do host, incluindo:

```dotenv
NODE_ENV=production
PORT=8080
PANEL_URL=https://SEU_DOMINIO
DISCORD_REDIRECT_URI=https://SEU_DOMINIO/auth/discord/callback
JWT_SECRET=um_segredo_seguro_com_ao_menos_32_bytes
```

Registre exatamente a URL de callback de produção em **OAuth2 → General → Redirects**. Confirme também que o host mantém a pasta `data/` entre deploys; sem disco persistente, as configurações JSON podem ser perdidas. Depois do deploy, confira `https://SEU_DOMINIO/health`, que deve responder:

```json
{ "status": "ok" }
```

## Desenvolvimento

```bash
npm run typecheck
npm run panel:typecheck
npm run lint
npm test
npm run build
```

## Licença

Este repositório ainda não contém um arquivo `LICENSE`. Antes de publicar, escolha uma licença se quiser definir claramente como outras pessoas podem usar, modificar e redistribuir o projeto.
