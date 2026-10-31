# Interface e Temas

> Idioma / Language: [English](/en/interface.md) | [Polski](/pl/interface.md) | [Deutsch](/de/interface.md) | [Español](/es/interface.md) | [Français](/fr/interface.md) | **Português (BR)**

---

A interface de usuário do oXyFlow é construída sobre quatro dimensões visuais desacopladas: ambiente de execução, variante de layout, escala visual e tema de cor.

---

## Variantes de Layout

O aplicativo se adapta dinamicamente a três densidades visuais sem alterar o estado ou a lógica de negócio:

| Variante | Características | Cenário Recomendado |
| :--- | :--- | :--- |
| **Compacto (Compact)** | Widget flutuante minimalista com controles do timer, tarefa ativa e busca ágil. | Monitores secundários, telas reduzidas e trabalho em segundo plano. |
| **Médio (Medium)** | Layout dividido em duas colunas com projetos à esquerda e tarefas à direita. | Produtividade diária e gerenciamento balanceado de projetos. |
| **Completo (Full)** | Espaço de trabalho em três colunas com árvore de projetos, tarefas e painéis de relatório. | Auditorias aprofundadas, exportação de relatórios e configurações. |

A variante de layout pode ser alternada na barra superior ou em **Configurações → Interface**.

---

## Escala de Tipografia e Ícones

Além das variantes de layout, o oXyFlow disponibiliza três opções de escala controladas por tokens CSS:

- **Pequeno (Small)**: Maior densidade de itens, ideal para listas extensas de tarefas.
- **Médio (Medium)**: Escala padrão balanceada para monitores convencionais.
- **Grande (Large)**: Maior legibilidade para telas de alta resolução (HiDPI) ou apresentações.

---

## Formulário de Projeto em Dois Níveis

A barra lateral disponibiliza um formulário adaptativo de criação de projetos estruturado em dois níveis: uma linha principal compacta e uma gaveta expansível de opções avançadas:

### Linha Principal (Nível 1)
- **Nome do Projeto**: Campo de texto direto (pressionar Enter cria o projeto imediatamente).
- **Paleta Predefinida**: Seis amostras de cores selecionadas (`rose`, `teal`, `amber`, `violet`, `indigo`, `emerald`).
- **Seletor de Cor Personalizada (Paintbrush)**: O botão com ícone de pincel (Paintbrush) ao final da paleta abre um seletor interativo compatível com qualquer código de cor HEX (por exemplo, `#8B5CF6`).
- **Alternador de Opções Avançadas**: Botão de seta (**Mais opções** / **Ocultar opções**) para expandir ou recolher a gaveta de opções.
- **Botão Adicionar Projeto**: Botão principal para confirmar e salvar o projeto.

### Gaveta Expansível Avançada (Nível 2)
- **Seletor de Ícone Emoji**: Popover para atribuir um ícone emoji ao projeto.
- **Nuvem de Sugestões de Tags**: Campo para tags separadas por vírgula acompanhado por uma nuvem dinâmica que identifica tags dos projetos existentes. Clicar em uma tag a insere diretamente no campo sem necessidade de digitação.
- **Descrição do Projeto**: Área de texto para anotações e escopo do projeto.
- **Alternador de Concorrência**: Controla se as tarefas deste projeto podem ser executadas simultaneamente com tarefas de outros projetos.

---

## Ciclo de Vida do Projeto: Exclusão vs. Arquivamento

Para assegurar a integridade dos registros de horas e evitar perdas acidentais de auditoria:

- **Projetos sem Tempo Registrado (`00:00:00`)**: Projetos sem sessões gravadas e sem timer ativo exibem o botão de exclusão permanente (ícone Trash2). A exclusão remove o projeto e metadados não vinculados de forma definitiva do armazenamento.
- **Projetos com Tempo Registrado (`> 00:00:00`)**: O motor de validação bloqueia a exclusão (`validate_project_deletion`). A interface substitui automaticamente o ícone de lixeira pelo botão **Arquivar**. O arquivamento oculta o projeto das barras laterais e seletores ativos, preservando todas as sessões históricas, tarefas e relatórios de auditoria.

---

## Temas Integrados

O oXyFlow oferece três temas integrados gerenciados via `ThemeRegistry`:

| ID do Tema | Nome Exibido | Características |
| :--- | :--- | :--- |
| `light` | Claro (Warm Daylight) | Fundo suave e acolhedor (`#F4EFEA`) com tipografia grafite legível (`#2C2421`). |
| `dark` | Escuro (Midnight Slate) | Fundo escuro profundo (`#0B0F19`) com cartões ardósia (`#0F172A`) e texto nítido. |
| `high-contrast` | Alto Contraste (Monochrome) | Preto puro (`#000000`) com bordas brancas puras (`#FFFFFF`) para máxima acessibilidade. |

A troca de tema é aplicada imediatamente alterando o atributo `data-theme` em `document.documentElement`, sem recarregar os componentes React.

---

## Tokens de Design Semânticos

Todos os componentes consomem tokens de design CSS em vez de valores hexadecimais fixos:

- Fundos: `bg-background`, `bg-card`, `bg-muted`
- Tipografia: `text-foreground`, `text-card-foreground`, `text-muted-foreground`
- Bordas e Campos: `border-border`, `border-input`
- Ações e Destaques: `bg-primary`, `text-primary-foreground`, `bg-accent`, `text-destructive`

---

## Registro de Temas Personalizados

Plugins e integrações de terceiros podem registrar novos temas em tempo de execução via TypeScript:

```typescript
import { ThemeRegistry } from '@/styles/themeRegistry';

ThemeRegistry.getInstance().register({
  id: 'custom-solarized',
  displayNameKey: 'ThemeSolarizedLabel',
  iconName: 'Sun',
  isDark: true,
  tokens: {
    background: '#002b36',
    foreground: '#839496',
    card: '#073642',
    cardForeground: '#93a1a1',
    border: '#586e75',
    input: '#586e75',
    primary: '#268bd2',
    primaryForeground: '#fdf6e3',
    secondary: '#073642',
    secondaryForeground: '#839496',
    accent: '#2aa198',
    accentForeground: '#fdf6e3',
    destructive: '#dc322f',
    destructiveForeground: '#ffffff',
    ring: '#b58900',
    muted: '#073642',
    mutedForeground: '#657b83',
  },
});
```
