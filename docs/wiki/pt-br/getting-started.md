# Primeiros Passos

> Idioma / Language: [English](/en/getting-started.md) | [Polski](/pl/getting-started.md) | [Deutsch](/de/getting-started.md) | [Español](/es/getting-started.md) | [Français](/fr/getting-started.md) | **Português (BR)**

---

Este guia orienta você no acesso ao oXyFlow via Web / PWA ou na instalação do aplicativo desktop, na preparação do ambiente e no registro de sua primeira sessão de tempo.

---

## Aplicação Web e PWA (Sem Instalação)

Você pode usar o oXyFlow imediatamente sem a necessidade de baixar instaladores:

1. Acesse **[beoarcha.github.io/TimeLog/app/](https://beoarcha.github.io/TimeLog/app/)** em qualquer navegador moderno (Chrome, Edge, Firefox, Safari).
2. Todo o timer e os dados operam e persistem 100% localmente no armazenamento privado do navegador.
3. **Instalação como PWA**: Em navegadores compatíveis, clique em **Instalar aplicativo** na barra de endereços para instalar o oXyFlow como um aplicativo independente com suporte offline no seu computador ou celular.

---

## Instalação no Desktop

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

1. Abra o **oXyFlow** (versão desktop ou web).
2. Clique no botão **"+ Novo Projeto"** na barra lateral.
3. Digite o nome do projeto (ex.: `Portal do Cliente`) e selecione uma cor de identificação. Clique em **Salvar**.
4. Dentro do projeto criado, clique em **"+ Adicionar tarefa"**. Digite o título (ex.: `Implementação da API`) e pressione **Enter**.

---

## Registro de Tempo

- Clique no botão **Iniciar (▶)** ao lado da tarefa para iniciar o cronômetro.
- A barra de status destacará a tarefa ativa com a contagem de tempo em tempo real.
- Clique em **Pausar (⏸)** ou **Parar (■)** para encerrar a sessão.
- Iniciar outra tarefa interrompe automaticamente a anterior em uma transação atômica.

---

## Próximos Passos

- **[Uso do Temporizador](timer.md)**: Ajustes manuais, regras de sobreposição e histórico.
- **[CLI Básico (`oxy`)](cli.md)**: Operação do timer pelo terminal PowerShell ou Bash.
- **[Interface e Temas](interface.md)**: Personalização de densidades visuais e temas de cores.
