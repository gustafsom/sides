# Trilha JW — arquitetura e conteúdo

## Objetivo

A Trilha JW existe para treinar espanhol em situações reais de congregação: leitura da Bíblia, comentários, reuniões, designações, discursos e vocabulário bíblico/congregacional.

Ela é uma funcionalidade **não oficial**, sem afiliação com Watch Tower Bible and Tract Society, JW.ORG ou JW Library. Não utiliza logotipos, imagens ou identidade visual dessas organizações.

## Fronteira de copyright

O SIDES mantém a mesma regra desde o primeiro pack:

- não fazer scraping do JW.ORG;
- não copiar versículos para o código ou banco;
- não copiar artigos, parágrafos, publicações, transcrições, vídeos, imagens ou áudios;
- não armazenar páginas HTML;
- não redistribuir arquivos;
- não usar API não documentada;
- abrir recursos oficiais em outra aba quando necessário;
- manter no SIDES apenas conteúdo próprio, referências, métricas, progresso e informações que o próprio usuário digitar.

## Conteúdo próprio do SIDES

### Vocabulário

O pack especializado contém termos úteis para Bíblia, reuniões, congregação, leitura, discursos, ministério e qualidades. A expansão curricular geral também inclui conversação congregacional original, sem copiar publicações.

### Livros da Bíblia

O treino usa nomes dos 66 livros em português e espanhol e abreviações usuais como dados referenciais.

### Leitura pública e discursos

As rubricas do SIDES usam descrições próprias de competências gerais de comunicação: exatidão, naturalidade, ritmo, modulação, ênfase, preparação antes da leitura, explicação da relação entre texto e ideia, simplicidade, convicção, tom positivo, organização e conclusão.

## Minhas designações — Bloco 6

A rota `/assignments.html` implementa a agenda e preparação de designações.

Tipos disponíveis:

- leitura da Bíblia;
- comentário de reunião;
- designação de estudante;
- discurso;
- apresentação de ministério;
- outro.

### Dados armazenados

O SIDES armazena título definido pelo usuário, referência curta, data e horário, duração-alvo, notas escritas pelo próprio usuário, estado da preparação, duração dos ensaios, confiança, avaliações de rubricas e notas dos ensaios.

Não existe campo de importação automática de texto do JW.org.

### Plano de preparação

O plano é calculado da data atual até a designação e fica progressivamente mais frequente:

1. **Fundamentos** — intervalos maiores; vocabulário, estrutura e dificuldades principais.
2. **Construção** — prática em blocos e correção dos trechos difíceis.
3. **Ensaio** — prática diária na última semana; execução completa e cronometrada.
4. **Revisão final** — baixa carga no dia anterior/no dia, priorizando confiança.

O plano é recalculado a partir da data e do histórico. Um treino registrado no mesmo dia marca aquela etapa como realizada.

### Prontidão e pontos de atenção

A prontidão de 0–100 considera quantidade de ensaios, confiança autoavaliada, média das rubricas e proximidade do tempo real em relação ao tempo-alvo. As rubricas com menor média aparecem como **pontos que merecem mais atenção** para os próximos ensaios.

### Áudio

O navegador pode gravar o ensaio para escuta imediata. O blob de áudio fica somente na memória da aba, não é persistido no SQLite, não é enviado a serviços externos e não aparece no backup. O banco registra apenas duração e avaliações.

## Fluxos

### Leitura bíblica

1. Abra a Bíblia oficial em espanhol em outra aba/JW Library.
2. Localize a referência cadastrada.
3. Faça os ensaios sugeridos.
4. Use cronômetro e, se desejar, gravação temporária.
5. Avalie rubricas e confiança.
6. O SIDES registra progresso e destaca os pontos mais fracos.

### Comentário

1. Estude a pergunta no recurso oficial.
2. Volte ao SIDES sem copiar o parágrafo.
3. Responda em espanhol em 30–60 segundos.
4. Registre confiança/rubricas.
5. Repita conforme o plano espaçado.

### Discurso/designação de estudante

1. Use seu próprio esboço/material autorizado fora do SIDES.
2. Cadastre apenas referência/título/notas próprias.
3. Treine blocos e depois ensaios integrais.
4. Compare duração com o tempo-alvo.
5. Use as rubricas mais fracas como prioridade do próximo ensaio.

## Recursos oficiais usados apenas como links

- Biblioteca: `https://www.jw.org/es/biblioteca/`
- Bíblia de estudo em espanhol: `https://www.jw.org/es/biblioteca/biblia/biblia-estudio/libros/`
- Série de leitura e ensino: `https://www.jw.org/es/biblioteca/videos/mejores-lectores-maestros-videos/`
- Programa de leitura da Bíblia: `https://www.jw.org/es/biblioteca/articulos/otros-temas/programa-lectura-biblia/`
- Termos de uso: `https://www.jw.org/es/condiciones-de-uso/`

## Próximas evoluções

- pronúncia/inteligibilidade offline com Whisper;
- treino de tempo ainda mais específico para comentários;
- relatórios comparativos de leitura/fala;
- integração das designações ao planejador diário do Bloco 10.
