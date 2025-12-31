# Cloudflare Pages Setup Guide

## Prerequisites

1. **Cloudflare Account**: Make sure you have a Cloudflare account
2. **Wrangler CLI**: Install Wrangler globally
   ```bash
   npm install -g wrangler
   ```

## 1. Login to Cloudflare

```bash
wrangler auth login
```

## 2. Create a new Cloudflare Pages project

You can either use the Cloudflare Dashboard or Wrangler CLI:

### Option A: Cloudflare Dashboard
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **Pages** > **Create a project**
3. Connect your GitHub repository
4. Configure build settings:
   - **Build command**: `npm run export`
   - **Build output directory**: `out`
   - **Root directory**: `/`

### Option B: Wrangler CLI
```bash
wrangler pages project create treine
```

## 3. Configure Environment Variables

### Via Cloudflare Dashboard:
1. Go to your Pages project in the Cloudflare Dashboard
2. Navigate to **Settings** > **Environment variables**
3. Add the following variables:

```
NEXT_PUBLIC_FIREBASE_API_KEY = AIzaSyDecBvUroirrQaFhBq1k2XyPBBFASyR9Mk
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = treine-2aa6f.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID = treine-2aa6f
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = treine-2aa6f.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = 363650815644
NEXT_PUBLIC_FIREBASE_APP_ID = 1:363650815644:web:acbc5e9880f42a3af27f59
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID = G-GDE01DML41
```

### Via Wrangler CLI:
```bash
# Set production environment variables
wrangler pages secret put NEXT_PUBLIC_FIREBASE_API_KEY
wrangler pages secret put NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
wrangler pages secret put NEXT_PUBLIC_FIREBASE_PROJECT_ID
wrangler pages secret put NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
wrangler pages secret put NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
wrangler pages secret put NEXT_PUBLIC_FIREBASE_APP_ID
wrangler pages secret put NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
```

## 4. Deploy

### Automatic Deployment (GitHub Integration)
- Push to your main branch and the deployment will start automatically

### Manual Deployment
```bash
npm run deploy
```

## 5. Custom Domain (Optional)

To use a custom domain:
1. Go to **Pages** > **Custom domains** in your Cloudflare Dashboard
2. Add your domain
3. Update DNS records as instructed

## 6. Troubleshooting

### Build Issues
- Make sure `output: 'export'` is set in `next.config.ts`
- Check that all environment variables are set correctly
- Verify Firebase configuration is working

### Runtime Issues
- Check browser console for Firebase errors
- Ensure all environment variables are properly set in Cloudflare
- Verify CORS settings in Firebase if needed

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| NEXT_PUBLIC_FIREBASE_API_KEY | Firebase API Key | AIzaSy... |
| NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN | Firebase Auth Domain | project.firebaseapp.com |
| NEXT_PUBLIC_FIREBASE_PROJECT_ID | Firebase Project ID | project-id |
| NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET | Firebase Storage Bucket | project.appspot.com |
| NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID | Firebase Messaging Sender ID | 123456789 |
| NEXT_PUBLIC_FIREBASE_APP_ID | Firebase App ID | 1:123:web:... |
| NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID | Google Analytics ID | G-ABCDEFGHIJ |

## Useful Commands

```bash
# Check deployment status
wrangler pages deployment list

# View deployment logs
wrangler pages deployment tail

# Delete a deployment
wrangler pages deployment delete <deployment-id>
