#!/usr/bin/env node

/**
 * Web Push通知セットアップ
 * VAPID鍵を生成
 */

const webpush = require('web-push');
const fs = require('fs');
const path = require('path');

console.log('🔐 VAPID鍵を生成中...\n');

// VAPID鍵を生成
const vapidKeys = webpush.generateVAPIDKeys();

console.log('✅ VAPID鍵が生成されました！\n');
console.log('公開鍵（Public Key）:');
console.log(vapidKeys.publicKey);
console.log('\n秘密鍵（Private Key）:');
console.log(vapidKeys.privateKey);
console.log('\n');

// .envファイルに保存
const envPath = path.join(__dirname, '.env');
let envContent = '';

if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
}

// 既存のVAPID設定を削除
envContent = envContent.split('\n').filter(line => 
    !line.startsWith('VAPID_PUBLIC_KEY=') && 
    !line.startsWith('VAPID_PRIVATE_KEY=') &&
    !line.startsWith('VAPID_SUBJECT=')
).join('\n');

// 新しいVAPID設定を追加
envContent += `\n# Web Push VAPID Keys
VAPID_PUBLIC_KEY=${vapidKeys.publicKey}
VAPID_PRIVATE_KEY=${vapidKeys.privateKey}
VAPID_SUBJECT=mailto:admin@minecraft.schale41.jp
`;

fs.writeFileSync(envPath, envContent.trim() + '\n');

console.log('✅ .envファイルに保存しました！');
console.log('\n📝 次のステップ:');
console.log('1. server-enhanced.jsを再起動してください');
console.log('2. ブラウザで通知許可をリクエストしてください');
console.log('3. プッシュ通知をテストしてください');
console.log('\n');
