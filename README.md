# Grupo Familiar

Sistema web para gerenciamento de grupos familiares, desenvolvido para centralizar
membros, grupos, reuniões, lições, relatórios e atividades administrativas.

> Esta é uma versão demonstrativa do projeto, disponibilizada para apresentação e portfólio.

## Demo

Acesse:

https://willy-santos-grupo-familiar-demo.universoconvite.workers.dev

## Sobre o projeto

O Grupo Familiar foi desenvolvido para centralizar e facilitar o gerenciamento
das atividades relacionadas aos grupos familiares.

A aplicação permite acompanhar grupos, membros, lições, relatórios, eventos e
outras informações em um único sistema.

O projeto também foi desenvolvido com foco em dispositivos móveis, contando com
interface responsiva e suporte a Progressive Web App (PWA).

## Funcionalidades

- Cadastro e autenticação de usuários
- Gerenciamento de grupos
- Gerenciamento de membros
- Relatórios
- Gerenciamento de lições
- Agenda e eventos
- Aniversariantes
- Gráficos e indicadores
- Arquivos e mídias
- Notificações
- Ofertas
- Configurações
- Perfil do usuário
- Controle de acesso e permissões
- Interface responsiva
- Progressive Web App (PWA)

## Tecnologias

### Front-end

- React
- TypeScript
- TanStack Start
- TanStack Router
- TanStack Query
- Tailwind CSS
- Radix UI
- Lucide React

### Back-end e infraestrutura

- Supabase
- Cloudflare Workers
- Nitro
- Vite

### Ferramentas

- ESLint
- Prettier
- Git
- GitHub
- Workbox

## Arquitetura

A aplicação é organizada de forma modular, separando componentes de interface,
autenticação, funcionalidades, rotas, serviços e recursos compartilhados.

```text
src/
├── components/
│   ├── common/
│   ├── layout/
│   └── ui/
├── features/
│   ├── auth/
│   └── settings/
├── hooks/
├── lib/
├── routes/
│   ├── _auth/
│   └── ...
├── router.tsx
├── server.ts
└── start.ts

Essa organização facilita a manutenção do projeto e permite que diferentes
funcionalidades sejam desenvolvidas e mantidas de forma independente.

Autenticação

A aplicação utiliza autenticação integrada ao Supabase, com proteção de rotas
e controle de acesso baseado em permissões.

Na versão Demo, novos usuários podem criar uma conta diretamente pela aplicação
e acessar o sistema para explorar as funcionalidades disponíveis.

Banco de dados

O projeto utiliza Supabase para armazenamento de dados e autenticação.

A estrutura do banco contempla informações relacionadas a:

Usuários e perfis
Grupos
Membros
Relatórios
Lições
Eventos
Notificações
Arquivos
Fotos
Configurações
Auditoria

A versão demonstrativa utiliza dados destinados exclusivamente ao ambiente
de teste e apresentação.

PWA

A aplicação possui suporte a Progressive Web App (PWA), permitindo sua
instalação em dispositivos compatíveis e proporcionando uma experiência
semelhante à de um aplicativo.

O projeto também utiliza Service Worker e mecanismos de cache para os recursos
da aplicação.

Ambiente Demo

Esta versão foi preparada especificamente para demonstração e portfólio.

Informações reais e dados privados presentes no ambiente de produção não fazem
parte desta versão demonstrativa.

A Demo não deve ser utilizada como ambiente de produção.

Deploy

A versão demonstrativa está hospedada utilizando Cloudflare Workers.

O projeto utiliza Vite e Nitro para o processo de build e geração dos arquivos
necessários para execução.

Executando localmente
Pré-requisitos
Node.js
npm
Git
Clone o projeto
git clone https://github.com/willy-santos/grupo-familiar-demo.git
cd grupo-familiar-demo
Instale as dependências
npm install
Configure as variáveis de ambiente

Crie um arquivo .env na raiz do projeto:

VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anon

Não adicione credenciais privadas ou chaves sensíveis ao repositório.

Execute em desenvolvimento
npm run dev
Gere o build de produção
npm run build
Status

Versão demonstrativa em desenvolvimento.

O projeto continua recebendo melhorias, correções e novas funcionalidades.

Autor

Willy Santos