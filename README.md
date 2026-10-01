# TheDobra — diagnóstico de maturidade em dados

Site estático responsivo em português, com 10 perguntas, cinco dimensões, nota geral, prioridades personalizadas e apresentação da TheDobra. Conteúdo alinhado ao site institucional consultado em 01/10/2026.

## Visualizar

Execute `node server.cjs` nesta pasta e abra http://127.0.0.1:4173.

## Hospedar

Publique o conteúdo da pasta `dist` em uma hospedagem estática. Não requer build, banco de dados ou chave de API. O servidor incluído é apenas para visualização local.

## Comportamento

- Quatro opções pontuadas de 0 a 3 e opção “Não sei” em cada pergunta.
- Nota normalizada entre 0 e 100, excluindo respostas desconhecidas; cobertura parcial explícita.
- Classificação: Inicial (0–24), Em estruturação (25–49), Conectada (50–74), Orientada por dados (75–100).
- Cada dimensão contém duas perguntas. As três menores pontuações orientam as recomendações; lacunas sem respostas vêm primeiro.
- Respostas existem apenas em memória e são descartadas ao recarregar. Não há captura ou envio de leads.
- Contato direciona para a seção oficial https://www.thedobra.cc/#contato.
- Logo fornecido pelo usuário. Fontes Google Fonts, com fallback local.

Validação: fluxo completo, navegação de retorno, nota personalizada, extremos da pontuação, respostas desconhecidas, layout móvel de 390px sem overflow horizontal.
