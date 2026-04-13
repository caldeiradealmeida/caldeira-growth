# Formulário de contato → Google Sheets (Apps Script)

Este documento descreve como conectar o formulário da página **Contato** à planilha:

`https://docs.google.com/spreadsheets/d/1NivGOjutCgJTGDjXxt8ydFiCeWrKvbbIdqmkVmwSC9M/edit`

Colunas esperadas na **primeira linha** (cabeçalho):

| timestamp | nome | email | empresa | cargo | tema | mensagem |

---

## 1. Criar o projeto Apps Script

1. Abra a planilha no Google Sheets.
2. Menu **Extensões** → **Apps Script**.
3. Apague o conteúdo padrão do arquivo `Código.gs` e cole o código abaixo.

---

## 2. Código (cole em `Código.gs`)

```javascript
/**
 * Web App: recebe POST JSON do site Caldeira Growth e grava uma linha na planilha.
 * Colunas: timestamp, nome, email, empresa, cargo, tema, mensagem
 */
var SPREADSHEET_ID = '1NivGOjutCgJTGDjXxt8ydFiCeWrKvbbIdqmkVmwSC9M';

function doPost(e) {
  try {
    if (!e.postData || !e.postData.contents) {
      return jsonResponse_({ ok: false, error: 'empty_body' });
    }
    var payload = JSON.parse(e.postData.contents);
    var nome = String(payload.nome || '').trim();
    var email = String(payload.email || '').trim();
    if (!nome || !email) {
      return jsonResponse_({ ok: false, error: 'validation' });
    }

    var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheets()[0];
    var timestamp = new Date();
    var empresa = String(payload.empresa || '').trim();
    var cargo = String(payload.cargo || '').trim();
    var tema = String(payload.tema || '').trim();
    var mensagem = String(payload.mensagem || '').trim();

    sheet.appendRow([timestamp, nome, email, empresa, cargo, tema, mensagem]);

    return jsonResponse_({ ok: true });
  } catch (err) {
    return jsonResponse_({ ok: false, error: String(err) });
  }
}

function jsonResponse_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}
```

---

## 3. Publicar como Web App

1. No editor Apps Script, clique em **Implantar** → **Nova implantação**.
2. Tipo: **App da Web**.
3. **Descrição:** ex.: `Caldeira contact form v1`.
4. **Executar como:** sua conta Google.
5. **Quem tem acesso:** **Qualquer pessoa** (para o site público conseguir enviar via `fetch`).
6. **Implantar** e autorize as permissões (acesso à planilha).

---

## 4. Permissões

Na primeira execução, o Google pedirá permissão para o script **acessar planilhas** e **conectar-se a serviços externos**. Aceite para a conta dona da planilha.

---

## 5. URL do endpoint

Após implantar, copie a **URL de execução** (termina em `/exec`).

Exemplo:

`https://script.google.com/macros/s/AKfycb.../exec`

---

## 6. No front-end (este repositório)

O formulário **não** chama o `…/exec` direto no navegador. O fluxo é:

- **POST** para **`/api/contact`** (mesmo domínio do site).
- Em **dev**, o Vite **proxy** encaminha para `VITE_CONTACT_FORM_URL`.
- Em **produção (Vercel)**, a função **`api/contact.ts`** (Edge) faz o `fetch` para o Apps Script no servidor.

Isso evita o problema do **redirect HTTP 302** de `script.google.com`: no navegador, ao seguir o redirect, o `fetch` pode tratar o POST de forma incompatível com o `doPost`, e a resposta deixa de ser JSON — o envio “falha” com erro genérico. No servidor (Node/Edge), o POST é encaminhado corretamente e o script responde `{"ok":true}`.

1. Crie o arquivo `.env` na raiz do projeto (ou `.env.local`):

   ```bash
   VITE_CONTACT_FORM_URL=https://script.google.com/macros/s/SEU_ID/exec
   ```

2. Reinicie o servidor de desenvolvimento (`npm run dev`).

3. **Produção (Vercel):** em **Project → Settings → Environment Variables**, adicione `VITE_CONTACT_FORM_URL` com a mesma URL e faça um novo deploy (a rota `/api/contact` precisa dessa variável no ambiente do servidor).

4. **`vite preview`** não inclui o proxy de dev: use **`npm run dev`** localmente ou o site já deployado para testar o envio.

---

## 7. Testar

1. Abra `/contato` no site (dev com `npm run dev` ou produção na Vercel).
2. Preencha nome, e-mail e tema; envie.
3. Verifique uma nova linha na planilha com `timestamp` e demais campos.

Se falhar, abra o **Console** (F12) em modo dev: há logs `[Caldeira contact form]` com status e corpo da resposta. Na aba **Rede**, confira **POST `/api/contact`** → status **200** e corpo JSON `{"ok":true}`.

---

## CORS e redirect

O Apps Script continua sendo o destino final; o navegador só fala com **`/api/contact`** no mesmo domínio, sem CORS para o Google. Garanta que a implantação do Web App está ativa, **Qualquer pessoa**, e que a URL termina em `/exec`.

---

## Segurança

- A URL do Web App é pública; qualquer um pode tentar POST. Para reduzir spam, considere no futuro: token secreto no payload, rate limit, ou reCAPTCHA (fora do escopo deste guia).
