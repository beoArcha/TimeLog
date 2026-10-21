# 💻 Comandos Básicos de Terminal (CLI)

🌐 **Idioma / Language**: [English](../Basic-Cli.md) | [Polski](../pl/Podstawowe-CLI.md) | [Deutsch](../de/Basis-CLI.md) | [Español](../es/CLI-Basico.md) | [Français](../fr/CLI-de-Base.md) | **Português (Brasil)**

---

Gosta de usar o teclado? O oXyFlow traz o utilitário nativo de linha de comando **`oxy`** para você iniciar e pausar cronômetros direto pelo PowerShell, CMD ou terminal do Linux/macOS.

---

## Os 5 Comandos Essenciais

No seu dia a dia, 5 comandos resolvem tudo:

### 1. Iniciar uma Tarefa

```bash
oxy start "Desenho da Página Inicial"
```

Inicia o cronômetro na hora.

- **Ajuda com erros de digitação**: Se você digitar `oxy start Desen`, o sistema sugere: *"Você quis dizer 'Desenho da Página Inicial'?"*.
- **Escolha simples**: Se houver mais de uma tarefa parecida, o `oxy` lista as opções para você apertar `1` ou `2`.

---

### 2. Parar o Cronômetro

```bash
oxy stop
```

Finaliza a tarefa em andamento e salva o registro.

---

### 3. Consultar o Status Atual

```bash
oxy status
```

Mostra o que está rodando agora:

```text
● Ativo: [Site do Cliente] Desenho da Página Inicial (01h 12m)
```

---

### 4. Resumo de Hoje

```bash
oxy today
```

Exibe uma tabela limpa com todas as tarefas trabalhadas no dia e a soma total de horas.

---

### 5. Criar Projetos e Tarefas

```bash
# Adicionar projeto
oxy project add "App Mobile"

# Adicionar tarefa no projeto
oxy task add "Tela de Login" --project "App Mobile"
```
