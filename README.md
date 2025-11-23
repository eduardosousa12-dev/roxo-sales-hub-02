# Grupo Rugido - Sales Hub

Sistema interno de CRM e gestão comercial desenvolvido para o Grupo Rugido. Permite acompanhar todo o funil de vendas, desde o primeiro contato até o recebimento.

## Funcionalidades

- **Dashboard** - Visão geral com métricas de performance, taxa de conversão, ranking de vendedores e gráficos comparativos
- **Diário** - Registro de atividades diárias (reuniões, ligações, propostas enviadas)
- **Propostas** - Acompanhamento de propostas em aberto, com opção de marcar como ganha ou perdida
- **Histórico** - Consulta de todas as atividades com filtros avançados e edição inline
- **Recebíveis** - Controle financeiro de vendas e pagamentos recebidos
- **Administração** - Gestão de usuários e permissões (restrito a super admins)

## Stack

- React 18 + TypeScript
- Vite
- Tailwind CSS + shadcn/ui
- Supabase (autenticação e banco de dados)
- Wouter (rotas)

## Rodando o projeto

1. Clone o repositório
2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente criando o arquivo `client/.env`:
```env
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_PUBLISHABLE_KEY=sua_chave_anonima
```

4. Rode o servidor de desenvolvimento:
```bash
npm run dev
```

## Estrutura

```
client/
├── src/
│   ├── components/     # Componentes de UI
│   ├── contexts/       # Contextos React (autenticação)
│   ├── hooks/          # Hooks customizados
│   ├── integrations/   # Configuração do Supabase
│   ├── pages/          # Páginas da aplicação
│   └── lib/            # Funções utilitárias
```

## Deploy

O projeto está configurado para deploy na Vercel. Basta conectar o repositório e configurar as variáveis de ambiente no painel da Vercel.

## Banco de Dados

O schema do Supabase inclui:
- `profiles` - Dados dos usuários
- `activities` - Atividades/reuniões registradas
- `payments` - Pagamentos recebidos
- `super_admins` - Controle de permissões administrativas
