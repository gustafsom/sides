# Arquitetura do SIDES

## Princípios

- **Local-first:** a aplicação e o banco de progresso executam na máquina do usuário.
- **Loopback-only:** o servidor HTTP escuta apenas `127.0.0.1` por padrão.
- **Zero dependência obrigatória de SaaS:** nenhuma funcionalidade central depende de API paga ou cota gratuita externa.
- **Progressive enhancement:** módulos de voz e NLP mais pesados podem ser instalados depois sem impedir o núcleo de funcionar.
- **Privacidade por padrão:** histórico de estudo, respostas e banco SQLite ficam fora do Git.
- **Fail-closed para integrações:** integração futura com SISDEV deve executar somente testes/builds allowlisted, sem comandos remotos arbitrários.

## Componentes do MVP

```text
Navegador
  | HTTP loopback
  v
Node.js HTTP Server
  |-- API de aprendizagem
  |-- Motor adaptativo / SRS
  |-- Gamificação
  |-- Conteúdo original do SIDES
  v
SQLite local (data/sides.sqlite)
```

O front-end não carrega CDN, fonte, analytics ou script externo.

## Persistência

SQLite guarda:

- metadados do perfil pedagógico;
- vocabulário e estado de revisão;
- tentativas e desempenho;
- atividade diária e XP;
- resultado do diagnóstico CEFR aproximado.

O diretório `data/` é ignorado pelo Git. O usuário pode gerar um backup JSON local pela interface.

## Limites de segurança

- bind padrão em `127.0.0.1`;
- limite de payload HTTP de 1 MiB;
- Content-Security-Policy restritiva;
- sem cookies, autenticação remota ou telemetria;
- nenhum dado pessoal necessário para usar o MVP;
- nenhuma credencial externa necessária.

## Estratégia de evolução

1. Fundação local + diagnóstico + quatro competências + gamificação.
2. FSRS completo e currículo adaptativo por erros.
3. Voz offline opcional: ASR e TTS locais.
4. Correção gramatical/NLP local opcional.
5. Conteúdo expandido, desafios e relatórios de domínio por habilidade.
6. Empacotamento Windows com instalação/atualização segura.
