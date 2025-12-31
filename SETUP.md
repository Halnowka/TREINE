# 🚀 Setup Seguro do Projeto TREINE

Este guia explica como configurar o projeto TREINE de forma segura, mantendo as credenciais protegidas mesmo com código aberto.

## ⚠️ AVISO DE SEGURANÇA

**NUNCA commite credenciais reais no GitHub!** As chaves Firebase atuais do projeto estão comprometidas e precisam ser substituídas.

## 📋 Pré-requisitos

- Node.js 18 ou superior
- Conta Google (para Firebase)
- Conta Cloudflare Pages (para deploy)

## 🔐 Passo 1: Configurar Firebase

### 1.1 Criar/Renovar Projeto Firebase

1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. **CRIE UM NOVO PROJETO** (não use o atual comprometido)
3. Ative os serviços:
   - **Authentication** (Email/Password)
   - **Firestore Database**
   - **Storage** (opcional)

### 1.2 Configurar Authentication

1. No Firebase Console → Authentication → Sign-in method
2. Ative **Email/Password**
3. Configure regras de senha se necessário

### 1.3 Obter Credenciais

1. No Firebase Console → Project Settings → General → Your apps
2. Clique em "Add app" → Web app (</>)
3. Copie as configurações mostradas

## 🔧 Passo 2: Configuração Local

### 2.1 Clonar e Instalar

```bash
git clone https://github.com/SEU_USERNAME/TREINE.git
cd TREINE-master
npm install
```

### 2.2 Configurar Variáveis de Ambiente

```bash
# Copie o arquivo de exemplo
cp .env.example .env.local

# Edite .env.local com suas credenciais Firebase
# NUNCA edite .env.example diretamente!
```

**Conteúdo do `.env.local`:**
```bash
NEXT_PUBLIC_FIREBASE_API_KEY=AQUI_SUA_API_KEY_REAL
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=seu-projeto-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=seu-projeto.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef123456
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-ABCDEFGHIJ
```

### 2.3 Configurar Firestore Security Rules

1. No Firebase Console → Firestore Database → Rules
2. Cole o conteúdo do arquivo `firestore.rules` do projeto
3. Clique "Publish"

### 2.4 Testar Localmente

```bash
npm run dev
```

Acesse `http://localhost:3000` e teste o login/registro.

## 🌐 Passo 3: Deploy no Cloudflare Pages

### 3.1 Configurar Build Settings

1. No painel Cloudflare Pages, crie um novo projeto
2. Conecte seu repositório GitHub
3. Configure build settings:
   - **Build command**: `npm run build`
   - **Build output directory**: `out`
   - **Root directory**: `/`

### 3.2 Configurar Environment Variables

1. No projeto Cloudflare Pages → Settings → Environment variables
2. Adicione cada variável do `.env.example`:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Sua API Key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | seu-projeto.firebaseapp.com |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | seu-project-id |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | seu-projeto.appspot.com |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | 123456789 |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | 1:123456789:web:abcdef123456 |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | G-ABCDEFGHIJ |

### 3.3 Deploy

1. Faça commit das mudanças
2. Push para GitHub
3. O Cloudflare Pages fará deploy automaticamente

## 🔒 Passo 4: Verificações de Segurança

### 4.1 Executar Verificação de Segurança

```bash
npm run security-check
```

### 4.2 Verificar no Navegador

1. Abra DevTools (F12)
2. Vá para Network/Application tab
3. Procure por `AIzaSy` ou outras chaves hardcoded
4. **Não deve haver nenhuma credencial exposta!**

## 📝 Estrutura de Arquivos Segura

```
TREINE-master/
├── .env.example          ✅ Commitado (template)
├── .env.local           ❌ NUNCA commitar (suas chaves)
├── src/lib/firebase.ts   ✅ Seguro (usa process.env)
├── firestore.rules       ✅ Seguro (regras de acesso)
└── SETUP.md             ✅ Documentação
```

## 🚨 Troubleshooting

### Erro: "Missing required environment variable"

- Verifique se `.env.local` existe
- Confirme que todas as variáveis estão preenchidas
- Reinicie o servidor de desenvolvimento

### Erro: "PERMISSION_DENIED" no Firestore

- Verifique se as regras foram publicadas no Firebase Console
- Confirme se o usuário está autenticado
- Verifique se os dados incluem `userId` correto

### App não carrega no Cloudflare Pages

- Verifique se todas as environment variables estão configuradas
- Confirme se o build command está correto (`npm run build`)
- Verifique os logs de build no painel Cloudflare

## 🔄 Manutenção Contínua

### Rotacionar Chaves (Recomendado)

1. Gere novas chaves no Firebase Console
2. Atualize `.env.local`
3. Atualize variáveis no Cloudflare Pages
4. Remova as chaves antigas do Firebase Console

### Monitoramento

- Monitore uso da API no Firebase Console
- Configure alertas de segurança
- Regularmente revise logs de acesso

## 📞 Suporte

Para questões de segurança, consulte:
- [Firebase Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
