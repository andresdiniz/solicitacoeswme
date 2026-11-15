Aqui está um **README.md completo** pronto para o repositório. Posso também criar/atualizar o arquivo `README.md` na branch `main` se você confirmar.

```markdown
# ToolboxWaze — Central de solicitações WME

**ToolboxWaze** é uma central de solicitações para o Waze Map Editor (WME), com userscript que permite criar, enviar e acompanhar solicitações diretamente no editor, conectado a uma API própria.

O projeto é composto por:

- **Userscript** (`public/userscripts/toolboxwaze-solicitacoes.user.js`) — interface no WME.
- **API** (`/api/wme`) — backend que recebe solicitações, formulários, anexos e contexto do WME.
- **Painel web** — visualização e acompanhamento das solicitações.

---

## Funcionalidades

- Conexão por e-mail com confirmação única (sem senha ou cookie do Waze).
- Token de dispositivo aleatório, armazenado apenas no navegador.
- Contexto automático do WME: seleção, permalink, zoom, coordenadas e bloqueio do objeto.
- Formulários dinâmicos carregados da API.
- Validação de permalink (coordenadas e zoom mínimo).
- Anexos (imagens) com limites de tamanho e formato.
- Rascunhos locais por formulário (com expiração de 7 dias).
- Verificação de duplicatas antes do envio (por segmento).
- Histórico “Minhas solicitações” com link e status.
- Detalhes da solicitação: status, link e comentários públicos.
- Tratamento de dispositivo expirado/revogado.
- Envio pendente com confirmação de resultado (evita duplicação em falha de rede).

---

## Instalação do userscript

1. Instale uma extensão de userscript (Tampermonkey, Violentmonkey, etc.).
2. Abra o WME: `https://www.waze.com/editor` ou `https://beta.waze.com/editor`.
3. Instale o script a partir do raw GitHub:

   https://raw.githubusercontent.com/andresdiniz/ToolboxWaze/main/public/userscripts/toolboxwaze-solicitacoes.user.js

4. Recarregue o WME. O botão **“Toolbox · Solicitações”** aparecerá no canto inferior direito.

---

## Como usar

1. Clique em **Toolbox · Solicitações**.
2. Informe seu e-mail e apelido do WME.
3. Confirme o e-mail recebido (link válido por 60 minutos).
4. Escolha o formulário disponível.
5. Preencha os campos (muitos são preenchidos automaticamente pelo contexto do WME).
6. Clique em **Enviar solicitação**.
7. Acompanhe em **Minhas solicitações** → **Detalhes**.

---

## Endpoints da API

Base: `https://wazetoolbox.acheireviews.com.br/api/wme`

| Método | Rota | Descrição |
|---|---|---|
| GET | `/bootstrap` | Estado da conexão, usuário e formulários disponíveis. |
| POST | `/registrar` | Registro/início de conexão por e-mail. |
| POST | `/verificacao/reenviar` | Reenvio do e-mail de confirmação. |
| POST | `/dispositivo/revogar` | Revoga o dispositivo atual. |
| GET | `/formularios/{slug}` | Definição do formulário (campos, validações). |
| GET | `/solicitacoes` | Lista das solicitações do usuário. |
| GET | `/solicitacoes/{id}/status` | Status, link e comentários públicos. |
| POST | `/duplicatas` | Verificação de duplicata por segmento. |
| POST | `/solicitacoes` | Criação de solicitação (multipart, com anexos). |
| GET | `/envios/{clientRequestId}` | Consulta do resultado de envio pendente. |

---

## Segurança

- Nenhuma senha ou cookie do Waze é enviado.
- O token do dispositivo é gerado aleatoriamente no navegador e enviado no header `X-API-TOKEN`.
- A confirmação de e-mail é obrigatória antes do envio.
- Dispositivos podem expirar por inatividade (`dispositivo_expirado`) ou ser revogados (`dispositivo_revogado`).
- Permalinks exigem coordenadas e zoom mínimo configurado por campo.

---

## Configuração do servidor (Symfony)

- Liberar as rotas `/api/wme` no `config/packages/security.yaml`.
- Configurar o `WmeDeviceAuthenticator` em `services.yaml`.
- Rodar as migrations para criar as tabelas necessárias.
- Rodar `php bin/console cache:clear` após alterações de configuração.

---

## Desenvolvimento

- Userscript: `public/userscripts/toolboxwaze-solicitacoes.user.js`
- API: rotas em `/api/wme`
- Diagnóstico no console: `twDiagnostico()` e `twTestarApi()`

---

## Licença

Defina a licença do projeto (ex.: MIT, Apache-2.0) conforme sua preferência.
```

Se quiser, eu posso **criar/atualizar o `README.md` na branch `main`** com esse conteúdo. Confirma?
