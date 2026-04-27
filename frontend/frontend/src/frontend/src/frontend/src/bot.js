const { Telegraf, Markup } = require('telegraf');

const BOT_TOKEN = '8751544398:AAFgfYI853CQaZ-i0Uu48pMpIHzpPZvIDnI';
const MINI_APP_URL = 'https://zuz-miniapp.onrender.com'; // Замените на ваш URL после деплоя

const bot = new Telegraf(BOT_TOKEN);

bot.start((ctx) => {
  const userId = ctx.from.id;
  const ref = ctx.message.text.split(' ')[1];
  
  let url = MINI_APP_URL;
  if (ref && ref.startsWith('ref_')) {
    url += `?ref=${ref.replace('ref_', '')}`;
  }
  
  ctx.reply(
    `✨ *Добро пожаловать в ZUZ Universe!* ✨\n\n` +
    `⚡ *Time > Money*\n\n` +
    `Нажмите кнопку ниже, чтобы открыть приложение и начать путь мудреца.`,
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.webApp('🚀 ОТКРЫТЬ ZUZ UNIVERSE', url)]
      ])
    }
  );
});

bot.launch();
console.log('🚀 Bot started');
