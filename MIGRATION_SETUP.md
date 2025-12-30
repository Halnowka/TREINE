# 🚀 TREINE Database Migration Setup Guide

## ⚠️ IMPORTANTE: Backup First!
**Antes de executar qualquer migração, faça um backup completo do seu banco de dados Firestore!**

## 📋 Pré-requisitos

### 1. Firebase Admin SDK Credentials

Você precisa configurar credenciais administrativas do Firebase:

#### Passo 1: Acesse o Firebase Console
1. Vá para [Firebase Console](https://console.firebase.google.com/)
2. Selecione seu projeto: `calistenia-98d6b`

#### Passo 2: Gere a chave de serviço
1. Clique em ⚙️ **Configurações do Projeto** (ícone de engrenagem)
2. Vá para a aba **Contas de Serviço**
3. Clique em **Gerar nova chave privada**
4. Selecione **Gerar chave** (formato JSON)
5. O arquivo será baixado automaticamente

#### Passo 3: Configure as credenciais
1. Renomeie o arquivo baixado para `service-account.json`
2. Coloque o arquivo em: `scripts/service-account.json`

**⚠️ NUNCA commite este arquivo no Git! Ele já está no .gitignore.**

### 2. Verifique as permissões
Certifique-se de que sua conta de serviço tem permissões administrativas no Firestore.

## 🏃‍♂️ Executando a Migração

### Comando de Migração
```bash
npm run migrate-admin
```

### O que a migração faz:
1. **Escaneará** todas as coleções existentes (`weights`, `workouts`, `userProgress`)
2. **Identificará** todos os usuários únicos
3. **Migrará** os dados para a nova estrutura hierárquica
4. **Removerá** os dados das coleções antigas
5. **Gerará** um relatório detalhado

### Exemplo de saída:
```
🚀 Starting TREINE database migration (Admin SDK)...
✅ Firebase Admin SDK initialized successfully

📊 Found 5 users to migrate

👤 Migrating user: abc123...
🔍 Scanning collections...
   ⚖️  Migrated 25 weight entries
   💪 Migrated 12 workout entries
   📈 Migrated user progress

[... outros usuários ...]

📋 TREINE DATABASE MIGRATION REPORT (ADMIN SDK)
============================================================
👥 Users processed: 5
⚖️  Weights migrated: 125
💪 Workouts migrated: 60
📈 Progress records migrated: 5

✅ Migration completed successfully!
```

## 🔍 Verificação Pós-Migração

Após a migração, verifique se tudo está funcionando:

### 1. Teste o aplicativo
- Faça login com uma conta existente
- Verifique se os dados aparecem corretamente
- Teste adicionar novos pesos e treinos

### 2. Verifique no Firebase Console
- Vá para Firestore Database
- Confirme que as novas coleções `users/{userId}/` existem
- Verifique se as coleções antigas estão vazias

### 3. Teste queries
```javascript
// Novo formato de queries
const userWeights = await getDocs(collection(db, 'users', userId, 'weights'));
const userWorkouts = await getDocs(collection(db, 'users', userId, 'workouts'));
```

## 🛠️ Troubleshooting

### Erro: "service-account.json not found"
```
❌ Failed to initialize Firebase Admin SDK:
Make sure service-account.json exists in the scripts/ directory
```
**Solução:** Baixe novamente a chave de serviço e coloque no local correto.

### Erro: "Permission denied"
```
💥 Migration failed: [FirebaseError: Missing or insufficient permissions.]
```
**Solução:** Verifique se a conta de serviço tem permissões administrativas.

### Erro: "Project ID mismatch"
```
Check Firebase project ID matches your configuration
```
**Solução:** Verifique se o projectId no script `migrate-admin.ts` está correto.

## 📊 Estrutura Após Migração

### Antes (Flat Collections)
```
Firestore/
├── weights/ (removido)
├── workouts/ (removido)
├── userProgress/ (removido)
└── exercises/ (mantido)
```

### Depois (Hierarchical Structure)
```
Firestore/
├── users/{userId}/
│   ├── profile/ (configurações do usuário)
│   ├── weights/{weightId} (histórico de peso)
│   ├── workouts/{workoutId} (histórico de treinos)
│   └── progress/progress (progresso do programa russo)
├── exercises/ (público, read-only)
└── Legacy collections (removidas após migração)
```

## 🔄 Rollback (se necessário)

Se algo der errado durante a migração:

1. **Pare imediatamente** a migração (Ctrl+C)
2. **Restaure** do backup do Firestore
3. **Reverta** o código para a versão anterior
4. **Investigue** o erro antes de tentar novamente

## 🎯 Benefícios Após Migração

- **🔒 Segurança aprimorada** com validações rigorosas
- **⚡ Performance melhorada** com índices otimizados
- **🛡️ Type safety completo** com validações Zod
- **📊 Escalabilidade** preparada para crescimento
- **🔧 Manutenibilidade** simplificada

## 📞 Suporte

Se encontrar problemas:

1. Verifique este guia primeiro
2. Reveja os logs de erro
3. Teste com dados pequenos primeiro
4. Crie uma issue no repositório com detalhes do erro

---

**Status:** Pronto para migração
**Última atualização:** Dezembro 2025
