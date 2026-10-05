# Guia de Publicação Mobile: Google Play Store & Apple App Store (NotaDiária)

Este projeto está 100% configurado com **PWA Manifest** e integração com **Capacitor** para geração de binários nativos (`.aab` / `.apk` no Android e `.ipa` no iOS).

---

## 1. Configurações Prontas no Projeto
- **PWA Manifest**: Configurado em `/public/manifest.json` com ícones adaptativos (`maskable`), splash background `#0F172A`, cores de tema `#16324F` e atalhos rápidos.
- **Capacitor Config**: Arquivo `capacitor.config.ts` com App ID `br.com.notadiaria.app`, splash screen nativo, status bar e permissões de câmera.
- **Ícones**: Dimensões completas em `/public/Logo-icones/` (48px, 96px, 120px, 180px, 192px, 512px e 1024px).

---

## 2. Comandos Rápidos para Gerar o App Nativo

### Passo 1: Instalar plataformas nativas (apenas na primeira vez)
```bash
# Para gerar o projeto Android (Google Play)
npm install @capacitor/android
npx cap add android

# Para gerar o projeto iOS (Apple Store - requer macOS com Xcode)
npm install @capacitor/ios
npx cap add ios
```

### Passo 2: Sincronizar o build web com o projeto nativo
```bash
# Compila o frontend e copia para as pastas android/ e ios/
npm run cap:build
```

### Passo 3: Abrir no Android Studio ou Xcode
```bash
# Abre o projeto no Android Studio (para gerar o .AAB da Play Store)
npx cap open android

# Abre o projeto no Xcode (para submissão no TestFlight / App Store)
npx cap open ios
```

---

## 3. Checklist de Lançamento na Google Play Store
1. **Google Play Console**: Criar a aplicação e preencher a ficha de metadados.
2. **Formulário de Segurança de Dados (Data Safety)**:
   - Tipo de dados: Fotos/Comprovantes (para fins de prestação de contas) e E-mail (autenticação).
   - Criptografia em trânsito: Sim (HTTPS/TLS).
3. **Geração do Pacote**:
   - No Android Studio: `Build > Generate Signed Bundle / APK > Android App Bundle (.aab)`.
   - Utilize sua Chave de Assinatura (Keystore) do Google Play App Signing.

---

## 4. Checklist de Lançamento na Apple App Store
1. **App Store Connect**: Criar novo aplicativo com o Bundle Identifier `br.com.notadiaria.app`.
2. **Privacidade e Permissões (`Info.plist`)**:
   - `NSCameraUsageDescription`: "O NotaDiária utiliza a câmera para digitalizar notas fiscais e cupons com OCR."
   - `NSPhotoLibraryUsageDescription`: "Permite selecionar recibos salvos na galeria de fotos."
3. **Submissão**:
   - No Xcode: `Product > Archive > Distribute App > App Store Connect`.
