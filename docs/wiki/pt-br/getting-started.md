# Primeiros Passos

> Idioma / Language: [English](/en/getting-started.md) | [Polski](/pl/getting-started.md) | [Deutsch](/de/getting-started.md) | [Español](/es/getting-started.md) | [Français](/fr/getting-started.md) | **Português (BR)**

---

Este guia orienta você na instalação do oXyFlow, na preparação do ambiente e no registro de sua primeira sessão de tempo.

---

## Instalação

Baixe o pacote apropriado para seu sistema operacional na [página de versões do GitHub](https://github.com/beoArcha/TimeLog/releases/latest):

- **Windows**: Execute o instalador `OxyFlow-Setup-x64.exe` ou utilize a versão portátil `OxyFlow-Standalone-x64.exe`.
- **macOS**: Abra o arquivo de imagem de disco `OxyFlow-Universal.dmg` e arraste o aplicativo `OxyFlow.app` para a pasta `/Applications`.
- **Linux**: Conceda permissão de execução para `OxyFlow-x86_64.AppImage` (`chmod +x OxyFlow-x86_64.AppImage`) ou instale o pacote `.deb` / `.rpm`:

  ```bash
  sudo dpkg -i oxyflow_amd64.deb
  # ou no Fedora/RHEL:
  sudo rpm -i oxyflow.x86_64.rpm
  ```

---

## Configuração do CLI (Opcional)

Os instaladores de desktop também disponibilizam o utilitário CLI chamado `oxy`. Para executar `oxy` diretamente no seu terminal (PowerShell, Bash, Zsh), confirme se o diretório de instalação está configurado na sua variável `PATH`:

- **Windows**: `%LOCALAPPDATA%\Programs\oXyFlow\`
- **Linux / macOS**: `/usr/local/bin/` ou `~/.local/bin/`

Confirme o funcionamento no terminal:

```bash
oxy --version
```

---

## Criando um Projeto e uma Tarefa

1. Abra o **oXyFlow**.
2. Clique no botão **"+ Novo Projeto"** na barra lateral.
3. Digite o nome do projeto (ex.: `Portal do Cliente`) e selecione uma cor de identificação. Clique em **Salvar**.
4. Dentro do projeto criado, clique em **"+ Adicionar tarefa"**. Digite o título (ex.: `Implementação da API`) e pressione **Enter**.

---

## Monitorando o Tempo

- Clique no botão **Iniciar (▶)** ao lado da tarefa para começar o temporizador imediatamente.
- A barra de status superior destacará a tarefa em execução e exibirá o tempo decorrido em tempo real.
- Clique em **Parar (■)** para encerrar a sessão de trabalho.
- Clicar em Iniciar em outra tarefa encerra a sessão ativa anterior e abre a nova em uma única transação atômica (`switch`).

---

## Próximos Passos

- **[Uso do Temporizador](timer.md)**: Regras de sobreposição, ajuste de registros e relatórios diários.
- **[CLI Básico (`oxy`)](cli.md)**: Controle completo via terminal.
- **[Interface e Temas](interface.md)**: Variantes de layout e personalização de cores.
