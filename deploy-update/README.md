# Instruções para Upload de Atualização - Versão 1.4.6

## 📦 Arquivos Prontos para Upload

Os seguintes arquivos estão prontos na pasta `deploy-update`:

- **InnoBet.apk** (100 MB) - Versão 1.4.6 (Build 126)
- **version.json** - Arquivo de controle de versão

## 🌐 Destino do Upload

Faça upload destes arquivos para:
```
https://www.inforcomputer.com/Atualizacoes/Fezinha_de_Hoje/
```

## 📋 Passos para Upload

1. **Acesse o servidor** onde está hospedado `www.inforcomputer.com`
   - Via FTP, SFTP, ou painel de controle (cPanel, Plesk, etc.)

2. **Navegue até a pasta de atualizações**:
   ```
   /Atualizacoes/Fezinha_de_Hoje/
   ```

3. **Faça upload dos arquivos**:
   - `InnoBet.apk` (substitua o arquivo existente)
   - `version.json` (substitua o arquivo existente)

4. **Verifique as permissões**:
   - Os arquivos devem estar acessíveis publicamente
   - Permissões recomendadas: 644

## ✅ Verificação

Após o upload, teste o acesso direto:
- APK: https://www.inforcomputer.com/Atualizacoes/Fezinha_de_Hoje/InnoBet.apk
- Version: https://www.inforcomputer.com/Atualizacoes/Fezinha_de_Hoje/version.json

## 🔄 Atualização Automática

Após o upload, os aplicativos irão:
1. Verificar a versão disponível no servidor
2. Comparar com a versão instalada (1.4.5 → 1.4.6)
3. Baixar e instalar automaticamente (force: true)

## 📝 Notas Importantes

- **Versão**: 1.4.6
- **Build**: 126
- **Atualização Forçada**: Sim (force: true)
- **Tamanho do APK**: ~100 MB
- **Novidades**: Logs de diagnóstico para impressão de layout alternativo

## 🎯 Objetivo desta Versão

Esta versão contém logs detalhados para diagnosticar o problema de impressão do layout alternativo. Após os usuários atualizarem, será possível coletar logs para identificar a causa raiz do problema.
