# CURESP — Third-party notices

Este arquivo registra os componentes de terceiros relevantes para a distribuição do CURESP 1.0.0. Ele não substitui os textos de licença distribuídos pelos próprios projetos.

## Incluídos no pacote Windows

### Node.js 24.x
- Uso: runtime local do CURESP.
- Distribuição: `payload/runtime/node.exe`.
- Licença: licença do projeto Node.js e licenças/avisos dos componentes incorporados pelo runtime.
- O build da versão 1.0 exige e inclui a licença completa do runtime como `payload/runtime/NODE-LICENSE.txt`.

### ts-fsrs 5.4.1
- Uso: repetição espaçada FSRS.
- Distribuição: `payload/node_modules/ts-fsrs`.
- Versão fixada: `5.4.1`.
- Licença: MIT.
- O diretório do pacote, incluindo seu arquivo de licença, é preservado no pacote Windows.

## Opcionais, não incluídos no pacote Windows

### whisper.cpp
- Uso: transcrição de fala inteiramente local.
- Licença do software: MIT.
- O CURESP não redistribui o binário nem o modelo; o configurador opcional baixa o componente separadamente após ação explícita do usuário e valida checksum.

### LanguageTool 6.6
- Uso: revisão gramatical local opcional.
- Licença do core: GNU LGPL 2.1; recursos podem ter licenças próprias.
- O CURESP não redistribui o ZIP/JAR. O configurador opcional baixa a distribuição separadamente, e o endpoint remoto público é bloqueado pelo backend.

### Piper
- Uso: síntese de voz local opcional.
- Projeto atual de referência: Piper sob GPL-3.0.
- Nenhum binário, pacote Python ou modelo de voz Piper é redistribuído pelo CURESP 1.0.0. Uma voz/modelo só deve ser usada após verificação da licença específica.

## Componentes do sistema operacional

O CURESP pode usar recursos já fornecidos pelo navegador/Windows, como `SpeechSynthesis`, PowerShell, WScript e APIs do sistema. Esses componentes não são redistribuídos pelo pacote do CURESP.

## Regra de release

O gate de release falha se `ts-fsrs` deixar de estar fixado em 5.4.1 ou se o pacote Windows não contiver o arquivo de licença do Node. Mudanças de dependências ou de estratégia de distribuição exigem nova auditoria de licenças antes de uma release.
