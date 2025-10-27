import {
  Client,
  GatewayIntentBits,
  Events,
  Message,
  AttachmentBuilder,
  Collection,
} from 'discord.js';
import AdmZip from 'adm-zip';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildEmojisAndStickers,
  ],
});

// サポートされる画像形式
const SUPPORTED_FORMATS = ['.png', '.jpg', '.jpeg', '.gif'];
const MAX_EMOJI_SIZE = 256 * 1024; // 256KB
const MAX_EMOJIS_PER_ZIP = 50; // 一度に処理する最大絵文字数

interface EmojiResult {
  success: string[];
  failed: Array<{ name: string; reason: string }>;
}

/**
 * ZIPファイルから画像を抽出
 */
function extractImagesFromZip(zipBuffer: Buffer): Map<string, Buffer> {
  const images = new Map<string, Buffer>();
  
  try {
    const zip = new AdmZip(zipBuffer);
    const zipEntries = zip.getEntries();

    for (const entry of zipEntries) {
      // ディレクトリをスキップ
      if (entry.isDirectory) continue;

      const fileName = path.basename(entry.entryName);
      const ext = path.extname(fileName).toLowerCase();

      // サポートされる画像形式のみ処理
      if (SUPPORTED_FORMATS.includes(ext)) {
        // macOSの隠しファイルをスキップ
        if (fileName.startsWith('._') || fileName.startsWith('.')) continue;

        const imageBuffer = entry.getData();
        
        // ファイルサイズチェック
        if (imageBuffer.length > MAX_EMOJI_SIZE) {
          console.log(`⚠️  ${fileName} is too large (${(imageBuffer.length / 1024).toFixed(2)}KB > 256KB)`);
          continue;
        }

        // ファイル名から拡張子を除いた部分を絵文字名として使用
        const emojiName = path.parse(fileName).name
          .replace(/[^a-zA-Z0-9_]/g, '_') // 使用できない文字をアンダースコアに変換
          .substring(0, 32); // Discordの絵文字名は32文字まで

        if (emojiName.length >= 2) {
          images.set(emojiName, imageBuffer);
        }
      }
    }
  } catch (error) {
    console.error('ZIP解凍エラー:', error);
    throw new Error('ZIPファイルの解凍に失敗しました');
  }

  return images;
}

/**
 * 絵文字をギルドに登録
 */
async function registerEmojis(
  message: Message,
  images: Map<string, Buffer>
): Promise<EmojiResult> {
  const result: EmojiResult = {
    success: [],
    failed: [],
  };

  if (!message.guild) {
    throw new Error('このコマンドはサーバー内でのみ使用できます');
  }

  // 権限チェック
  const member = message.member;
  if (!member?.permissions.has('ManageGuildExpressions')) {
    throw new Error('絵文字を管理する権限がありません');
  }

  // 現在の絵文字数をチェック
  const currentEmojiCount = message.guild.emojis.cache.size;
  const maxEmojis = message.guild.premiumTier === 0 ? 50 : 
                    message.guild.premiumTier === 1 ? 100 : 
                    message.guild.premiumTier === 2 ? 150 : 250;

  const remainingSlots = maxEmojis - currentEmojiCount;
  
  if (remainingSlots <= 0) {
    throw new Error('サーバーの絵文字スロットが満杯です');
  }

  console.log(`📊 絵文字スロット: ${currentEmojiCount}/${maxEmojis} (残り: ${remainingSlots})`);

  // 処理する画像の数を制限
  const imagesToProcess = Array.from(images.entries()).slice(0, Math.min(MAX_EMOJIS_PER_ZIP, remainingSlots));

  for (const [emojiName, imageBuffer] of imagesToProcess) {
    try {
      // 既存の絵文字と名前が重複していないかチェック
      const existingEmoji = message.guild.emojis.cache.find(e => e.name === emojiName);
      
      let finalName = emojiName;
      let counter = 1;
      while (existingEmoji && message.guild.emojis.cache.find(e => e.name === finalName)) {
        finalName = `${emojiName}_${counter}`;
        counter++;
      }

      // 絵文字を作成
      const emoji = await message.guild.emojis.create({
        attachment: imageBuffer,
        name: finalName,
      });

      result.success.push(`${emoji} \`${finalName}\``);
      console.log(`✅ 絵文字登録成功: ${finalName}`);

      // レート制限を避けるため少し待機
      await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (error: any) {
      const errorMessage = error.message || '不明なエラー';
      result.failed.push({ name: emojiName, reason: errorMessage });
      console.error(`❌ 絵文字登録失敗 (${emojiName}):`, errorMessage);
    }
  }

  return result;
}

/**
 * メッセージイベントハンドラー
 */
client.on(Events.MessageCreate, async (message: Message) => {
  // Botからのメッセージは無視
  if (message.author.bot) return;

  // ZIPファイルの添付ファイルをチェック
  const zipAttachment = message.attachments.find(
    attachment => attachment.name?.toLowerCase().endsWith('.zip')
  );

  if (!zipAttachment) return;

  console.log(`📦 ZIPファイルを受信: ${zipAttachment.name} (${message.author.tag})`);

  try {
    // 処理中メッセージを送信
    const processingMsg = await message.reply('🔄 ZIPファイルを処理中...');

    // ZIPファイルをダウンロード
    const response = await fetch(zipAttachment.url);
    const arrayBuffer = await response.arrayBuffer();
    const zipBuffer = Buffer.from(arrayBuffer);

    // 画像を抽出
    const images = extractImagesFromZip(zipBuffer);

    if (images.size === 0) {
      await processingMsg.edit('❌ ZIPファイル内に有効な画像が見つかりませんでした。\nサポートされる形式: PNG, JPG, GIF (最大256KB)');
      return;
    }

    console.log(`🖼️  ${images.size}個の画像を検出`);

    // 絵文字を登録
    await processingMsg.edit(`🔄 ${images.size}個の絵文字を登録中...`);
    const result = await registerEmojis(message, images);

    // 結果を報告
    let reportMessage = '';

    if (result.success.length > 0) {
      reportMessage += `✅ **登録成功 (${result.success.length}個)**\n`;
      reportMessage += result.success.join(' ') + '\n\n';
    }

    if (result.failed.length > 0) {
      reportMessage += `❌ **登録失敗 (${result.failed.length}個)**\n`;
      for (const fail of result.failed.slice(0, 10)) { // 最初の10件のみ表示
        reportMessage += `• \`${fail.name}\`: ${fail.reason}\n`;
      }
      if (result.failed.length > 10) {
        reportMessage += `...他${result.failed.length - 10}件\n`;
      }
    }

    // メッセージが長すぎる場合は分割して送信
    if (reportMessage.length > 2000) {
      await processingMsg.edit(`✅ 処理完了: ${result.success.length}個成功, ${result.failed.length}個失敗`);
      
      // 成功した絵文字を別メッセージで送信
      if (result.success.length > 0) {
        const successChunks = [];
        let currentChunk = '✅ **登録された絵文字**\n';
        
        for (const emoji of result.success) {
          if ((currentChunk + emoji + ' ').length > 1900) {
            successChunks.push(currentChunk);
            currentChunk = emoji + ' ';
          } else {
            currentChunk += emoji + ' ';
          }
        }
        if (currentChunk) successChunks.push(currentChunk);
        
        for (const chunk of successChunks) {
          await message.channel.send(chunk);
        }
      }
    } else {
      await processingMsg.edit(reportMessage);
    }

  } catch (error: any) {
    console.error('エラー:', error);
    const errorMessage = error.message || '予期しないエラーが発生しました';
    await message.reply(`❌ エラー: ${errorMessage}`);
  }
});

/**
 * Bot起動イベント
 */
client.once(Events.ClientReady, (readyClient) => {
  console.log(`✅ ログイン成功: ${readyClient.user.tag}`);
  console.log(`📊 ${readyClient.guilds.cache.size}個のサーバーに接続中`);
  console.log('🚀 Bot起動完了！ZIPファイルをアップロードして絵文字を登録できます。');
});

/**
 * エラーハンドリング
 */
client.on(Events.Error, (error) => {
  console.error('Discord client error:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error);
});

// Botを起動
const token = process.env.DISCORD_BOT_TOKEN;
if (!token) {
  console.error('❌ エラー: DISCORD_BOT_TOKEN環境変数が設定されていません');
  process.exit(1);
}

client.login(token);
