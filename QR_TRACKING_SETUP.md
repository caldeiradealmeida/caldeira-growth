# Configuração de Tracking para QR Code

## O que foi implementado

Foi criada uma página de redirecionamento (`/qr` ou `/amazon`) que:
1. Registra o acesso no Google Sheets
2. Mostra um countdown de 2 segundos
3. Redireciona automaticamente para a Amazon

## Como configurar o Google Apps Script

### Passo a passo completo:

1. **Abra seu Google Sheets** (o mesmo que você usa para o formulário)

2. **Vá em Extensões > Apps Script**

3. **Substitua todo o código existente** pelo código do arquivo `google-apps-script.js` que está na raiz do projeto

4. **Salve o projeto** (Ctrl+S ou Cmd+S)

5. **Publique o script:**
   - Clique em **Publicar > Implantar como aplicativo da web**
   - **Execute como:** Eu mesmo
   - **Quem tem acesso:** Qualquer pessoa, mesmo anônimo
   - Clique em **Implantar**
   - **Copie a URL gerada** (se for diferente da atual, atualize no código React)

6. **O script criará automaticamente:**
   - Aba "QR_Tracking" para os acessos do QR code
   - Aba "Cadastros" para os formulários (se não existir)

### O que o script faz:

- **Detecta automaticamente** se é um acesso via QR code ou um formulário
- **Cria as abas automaticamente** se não existirem
- **Formata os cabeçalhos** com cores diferentes para fácil identificação
- **Valida os dados** antes de salvar
- **Registra erros** para facilitar debug

### Testando o script:

No editor do Apps Script, você pode executar as funções de teste:
- `testTracking()` - Testa o registro de QR code
- `testForm()` - Testa o formulário de cadastro

### Nota importante:

O código em `google-apps-script.js` já está completo e pronto para uso. Ele gerencia tanto o tracking do QR code quanto o formulário de cadastro em um único script.

## URLs disponíveis

- `/qr` - Redireciona para Amazon com tracking
- `/amazon` - Redireciona para Amazon com tracking (alternativa)

## Análise dos dados

Após configurar, você poderá analisar:
- Quantidade de acessos via QR code
- Horários de maior tráfego
- Navegadores/dispositivos mais usados
- Origem do tráfego (referrer)

## Nota importante

O tracking usa `mode: 'no-cors'` porque o Google Apps Script não retorna headers CORS apropriados. Isso significa que não podemos verificar se o registro foi bem-sucedido, mas os dados serão salvos mesmo assim.

