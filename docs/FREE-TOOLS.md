# Ferramentas gratuitas avaliadas

A regra arquitetural é não depender de um serviço cujo “grátis” possa acabar por quota. O núcleo utiliza componentes locais; ferramentas externas mais pesadas continuam opcionais.

| Ferramenta | Uso | Custo operacional | Papel no SIDES | Situação |
|---|---|---:|---|---|
| Node.js | runtime | zero | núcleo | ativo |
| SQLite / `node:sqlite` | persistência | zero | núcleo | ativo |
| `ts-fsrs` **5.4.1** | repetição espaçada | zero | núcleo adaptativo | ativo no Bloco 4; versão fixada |
| Web Speech API / SpeechSynthesis | TTS inicial | zero | fallback local/SO | ativo |
| MediaRecorder | gravação de fala | zero | núcleo de fala | ativo |
| whisper.cpp | reconhecimento de fala | zero | opcional | Bloco 7 |
| Piper | síntese de voz | zero | opcional | Bloco 7; verificar licença de cada voz |
| LanguageTool | correção gramatical | zero | opcional | Bloco 8 |
| spaCy + modelos ES | NLP | zero | opcional | futuro |

## FSRS

O Bloco 4 usa `ts-fsrs@5.4.1` com execução local e versão exata no `package.json`.

Decisões:

- retenção-alvo inicial de 90%;
- intervalo máximo de 3650 dias;
- fuzz habilitado;
- passos curtos de aprendizagem/reaprendizagem;
- estado legado do scheduler V1 é convertido quando o item é revisado, sem zerar o progresso existente;
- o dashboard usa a retrievability estimada como **indicador**, não como garantia de memória individual.

No código-fonte, a primeira execução pode precisar de conexão para obter o pacote npm. O empacotamento Windows do Bloco 12 deverá eliminar essa etapa manual para o usuário final.

## Decisões gerais

### Não usar API pública como dependência central

APIs gratuitas de IA, tradução, TTS ou correção podem impor limites, mudar termos ou desaparecer. Elas não entram no caminho crítico.

### Modelos de voz e linguagem

Código open source e modelos podem ter licenças diferentes. O SIDES não redistribuirá automaticamente modelos sem verificação específica da licença.

### IA generativa

Não é necessária para o núcleo. Se adicionada posteriormente, deverá ser opcional e preservar um caminho funcional local e previsível em custo/privacidade.
