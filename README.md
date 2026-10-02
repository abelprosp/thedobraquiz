# TheDobra — diagnóstico de maturidade em dados

Site responsivo em português, com 10 perguntas, cinco dimensões, nota geral, prioridades personalizadas e formulário de contato integrado ao CRM. Conteúdo alinhado ao site institucional consultado em 01/10/2026.

## Visualizar

Requer Node.js 22 ou superior. Copie `.env.example` para `.env` e configure `CRM_API_TOKEN` com a chave do CRM. Execute `npm start` nesta pasta e abra http://127.0.0.1:4173. Não há dependências para instalar.

## Hospedar

### Vercel

Importe o repositório `abelprosp/thedobraquiz`, branch `main`. Use a raiz do repositório como Root Directory (não selecione `dist`). O `vercel.json` configura os arquivos estáticos em `dist` e a função `api/leads.js` atende `/api/leads`.

Antes do deploy, adicione `CRM_API_TOKEN` em Settings → Environment Variables para Production e, se necessário, Preview. Use o valor da chave do CRM, sem o prefixo `Bearer`. A chave local de `.env` não é enviada ao GitHub. Após alterar a variável, faça um novo deploy.

Na Vercel não é necessário configurar `HOST` ou `PORT`. O limite de tentativas em memória é por instância e não substitui proteção distribuída contra abuso. A integração foi validada localmente com CRM simulado; o deploy e o recebimento de um lead real ainda precisam ser verificados na hospedagem.

### Servidor Node.js

O formulário exige um servidor: hospedar apenas `dist` não permite enviar leads. Publique este projeto em uma hospedagem Node.js, execute `npm start` e configure `CRM_API_TOKEN` como segredo, `HOST=0.0.0.0` e a porta `PORT` fornecida pela hospedagem. Use HTTPS no domínio público.

O navegador envia `POST /api/leads` para o mesmo domínio. O servidor valida e encaminha exclusivamente `nome`, `email`, `telefone` e `empresa` para `https://app.persoocrm.online/api/webhooks/leads`, com autenticação Bearer. A chave nunca é servida ao navegador nem incluída no Git. A hospedagem precisa permitir conexão HTTPS de saída na porta padrão 443.

O envio tem limite de tamanho, validação, timeout e limite de 10 tentativas por minuto por conexão/IP. Atrás de proxy, o limite usa o IP do proxy; ajuste a proteção no provedor conforme a arquitetura. Não há reenvio automático para evitar duplicações em falhas de confirmação.

Execute `npm test` para verificar o contrato de envio, validação, falhas e limite de requisições com CRM simulado, sem criar leads reais.

## Comportamento

- Quatro opções pontuadas de 0 a 3 e opção “Não sei” em cada pergunta.
- Nota normalizada entre 0 e 100, excluindo respostas desconhecidas; cobertura parcial explícita.
- Classificação: Inicial (0–24), Em estruturação (25–49), Conectada (50–74), Orientada por dados (75–100).
- Cada dimensão contém duas perguntas. As três menores pontuações orientam as recomendações; lacunas sem respostas vêm primeiro.
- Respostas do quiz existem apenas em memória e são descartadas ao recarregar. Não são enviadas ao CRM.
- “Testar a ferramenta” e “Entrar em contato” abrem o formulário. Os dados são enviados ao CRM apenas ao clicar em “Solicitar contato”. Sucesso é exibido somente após resposta HTTP bem-sucedida do CRM.
- Logo fornecido pelo usuário. Fontes Google Fonts, com fallback local.

Validação: fluxo completo, navegação de retorno, nota personalizada, extremos da pontuação, respostas desconhecidas, layout móvel de 390px sem overflow horizontal.
