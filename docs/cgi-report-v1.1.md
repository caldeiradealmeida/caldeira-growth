# CGI report v1.1

## Escopo

A versão 1.1 altera apenas a geração e a renderização compatível do relatório CGI. Pontuação, pesos, perguntas, alternativas, fluxo do assessment, captura de lead, analytics e integrações existentes foram preservados.

## Fluxo atual auditado

- `api/cgi-assessment.ts` valida lead, normaliza respostas, calcula o score, enriquece o site público quando informado, chama OpenAI Responses e salva dados no Google Apps Script e no Supabase em modo best-effort.
- `api/cgi-core.ts` contém as 40 perguntas usadas no backend, cinco dimensões, faixas de maturidade e cálculo de score.
- `api/cgi-report-guide.ts` fornece o guia de estilo/metodologia usado no prompt.
- `src/features/cgi/services/report.ts` faz parse do JSON da IA, monta texto, HTML e PDF do relatório.
- `src/features/cgi/components/CgiResultStep.tsx` renderiza o resultado e a prévia do relatório na tela.
- `api/_cgi-supabase.ts` persiste leads, assessments, respostas individuais e eventos.

## Alterações

- O prompt passou a exigir separação explícita entre evidência do CGI, contexto público validado e hipótese executiva.
- O payload enviado ao modelo agora inclui `response_evidence`, com score geral, dimensões fortes/fracas, itens mais fortes/frágeis por dimensão e indicação de contraste interno.
- O contrato de saída do JSON aceita os campos opcionais `methodology_note`, `evidence_summary` e `hypotheses_to_validate`.
- As seções de gargalos, apostas, renúncias, governança e recomendações passaram a ser solicitadas com exatamente três itens.
- O relatório renderizado na página, no HTML/PDF e no texto de e-mail exibe os novos campos quando presentes e continua compatível com JSONs antigos que não os tenham.
- A versão metodológica persistida no assessment foi atualizada para `1.1.0`; a versão de pontuação segue `1.0.0`.
- A normalização das listas executivas agora preserva objetos estruturados retornados pelo modelo, convertendo seus valores em texto legível em vez de gerar `[object Object]`.
- A geração passa a validar conteúdo das listas executivas e a estrutura de `strategic_diagnosis`; saídas inválidas são elegíveis para segunda tentativa e não são aceitas silenciosamente.
- O limite de saída das chamadas OpenAI do relatório passou de `max_output_tokens: 5200` para `max_output_tokens: 10000`, porque a auditoria com `gpt-5.1` indicou truncagem em respostas JSON na faixa de 24.200 a 25.300 caracteres.
- O custo e a latência máximos por tentativa podem subir quando o modelo realmente usar o novo teto de saída. O valor foi escolhido para acomodar o relatório v1.1 completo em JSON sem abrir um teto excessivo para uma versão gratuita.
- A integração ainda usa JSON mode (`text.format.type = "json_object"`), não Structured Outputs com JSON Schema. A migração mínima recomendada é trocar o contrato textual por um schema estrito para as chaves do relatório e arrays de strings, mantendo o restante do fluxo.

## Dados e múltiplos respondentes

Campos já disponíveis hoje:

- nome da empresa;
- domínio/site da empresa;
- nome do respondente;
- cargo;
- pontuação geral;
- pontuação por dimensão;
- respostas individuais;
- comentários abertos;
- data de conclusão;
- identificador público do assessment;
- identificador anônimo da sessão.

Campos importantes para comparação futura que ainda não aparecem no formulário nem foram confirmados no schema do banco:

- região declarada pelo respondente;
- unidade de negócio;
- identificador canônico da empresa compartilhado entre respondentes;
- identificador canônico do respondente.

Esses campos foram preparados como opcionais no contexto do relatório caso sejam recebidos por payload futuro, mas nenhuma migração destrutiva foi feita.

## Validação

Testes automatizados adicionados em `tests/api/cgi-report-v1-1.test.ts`:

- Perfil A: Estratégia forte e Execução fraca.
- Perfil B: Mercado forte e Máquina de Crescimento fraca.
- Perfil C: notas altas e homogêneas com fragilidade pontual em liderança, representando atenção a transição/sucessão quando combinada com comentário aberto.
- Dois respondentes simulados da mesma empresa com respostas diferentes.
- Verificação de contrato do prompt v1.1.
- Verificação de JSON válido e limitação de arrays estratégicos excedentes.
- Verificação de objetos estruturados nas listas executivas, rejeição de itens inválidos e validação de 4 a 5 parágrafos substanciais no diagnóstico estratégico.

## Instrumentação de truncagem

O script de auditoria registra, por tentativa, modelo, contagem de caracteres, tokens de saída quando fornecidos pela API, `status`, `finish_reason`, `incomplete_details`, limite configurado e erro de parse. Se a Responses API indicar `status: incomplete`, `finish_reason: length` ou motivo relacionado a `max_output_tokens`, a falha é classificada como `output_truncated`.

Em caso de parse error no script, a resposta bruta do modelo é salva localmente em `/tmp/cgi-audit/raw/`. Esse comportamento não existe na produção.

Como a chave OpenAI pode não estar configurada em ambiente local, a validação automatizada cobre o contrato determinístico, a preservação do cálculo e a rastreabilidade enviada ao modelo.
