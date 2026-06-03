# Publicação via Google Sheets

O site pode complementar os artigos e a seção de mídia com novas abas em uma Google Sheet dedicada ao conteúdo. Se as variáveis de CSV não estiverem configuradas, os conteúdos atuais continuam funcionando normalmente.

Estrutura recomendada da planilha:

```text
Cadastros
QR_Tracking
Artigos
Midia
```

## Aba `Artigos`

Na planilha atual de leads, crie uma nova aba chamada `Artigos` com estas colunas na primeira linha:

```csv
status,date,slug,title_pt,title_en,excerpt_pt,excerpt_en,content_pt,content_en,cover_url,source_name,source_url
```

Campos:

- `status`: use `published` para publicar. Outros valores ficam fora do site.
- `date`: data exibida e usada na ordenação, de preferência `YYYY-MM-DD` ou `YYYY-MM`.
- `slug`: caminho do artigo, por exemplo `minha-nova-reflexao`.
- `title_pt`, `title_en`: título em português e inglês. Se `title_en` ficar vazio, o site usa `title_pt`.
- `excerpt_pt`, `excerpt_en`: resumo do card.
- `content_pt`, `content_en`: corpo do artigo. Use parágrafos separados por uma linha em branco.
- `cover_url`: imagem pública para a capa. Se ficar vazio, o site usa `/placeholder.svg`.
- `source_name`, `source_url`: opcionais, para indicar Google Docs, LinkedIn ou outro local original.

## Aba `Midia`

Na mesma Google Sheet usada para leads, crie uma nova aba chamada `Midia` com estas colunas:

```csv
status,date,title_pt,title_en,outlet,url,cover_url,featured
```

Campos:

- `status`: use `published` para publicar. Outros valores ficam fora do site.
- `date`: data de referência, de preferência `YYYY-MM-DD`.
- `title_pt`, `title_en`: título da matéria.
- `outlet`: veículo, por exemplo `Forbes Brasil`.
- `url`: link público da matéria.
- `cover_url`: reservado para uso futuro. A interface atual de mídia não exibe imagem.
- `featured`: reservado para destaque futuro. A interface atual não muda por esse campo.

## Publicar as abas como CSV

1. Abra a Google Sheet de conteúdo.
2. Vá em `Arquivo > Compartilhar > Publicar na Web`.
3. Selecione a aba `Artigos`.
4. Escolha o formato `CSV`.
5. Copie a URL publicada.
6. Repita o processo para a aba `Midia`.
7. Configure no `.env` local e no Vercel:

```bash
VITE_ARTICLES_SHEET_CSV_URL=https://docs.google.com/spreadsheets/d/e/.../pub?gid=0&single=true&output=csv
VITE_MEDIA_SHEET_CSV_URL=https://docs.google.com/spreadsheets/d/e/.../pub?gid=123456789&single=true&output=csv
```

## Fluxo com Chief of Staff

O agente pode receber um comando como:

```text
/artigo https://docs.google.com/document/d/...
```

Depois de extrair título, resumo e corpo do Google Docs, ele deve inserir uma linha na aba `Artigos` com `status=published`.

Para matérias externas:

```text
/midia https://veiculo.com.br/materia
```

Depois de extrair título e veículo, ele deve inserir uma linha na aba `Midia` com `status=published`.

Para a publicação do conteúdo, use um Apps Script próprio da planilha de conteúdo. Ele pode receber `POST` quando o CoS publicar um artigo ou mídia. Exemplo de payload para artigo:

```json
{
  "action": "article",
  "token": "CONTENT_POST_TOKEN",
  "title_pt": "Título",
  "content_pt": "Texto do artigo"
}
```

Ou mídia:

```json
{
  "action": "media",
  "token": "CONTENT_POST_TOKEN",
  "title_pt": "Título da matéria",
  "outlet": "Veículo",
  "url": "https://..."
}
```

Configure a propriedade do script:

```text
CONTENT_POST_TOKEN=um_token_longo_e_secreto
```

Se quiser, você pode manter `CONTENT_POST_TOKEN` como token de escrita do script de conteúdo. A planilha de leads não deve ser usada para isso.
