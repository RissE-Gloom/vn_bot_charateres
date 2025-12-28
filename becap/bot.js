require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');

const bot = new Telegraf(process.env.BOT_TOKEN);
const ADMIN_ID = process.env.ADMIN_ID;

// Store user sessions in memory (for simple logic)
const userSessions = {};

// Start command
bot.start((ctx) => {
    ctx.reply('Привет! Выбери персонажа:', Markup.inlineKeyboard([
        [Markup.button.callback('Персонаж 1', 'char_1')],
        [Markup.button.callback('Персонаж 2', 'char_2')],
        [Markup.button.callback('Персонаж 3', 'char_3')]
    ]));
});

// Character selection actions
bot.action('char_1', (ctx) => handleCharacterSelection(ctx, 'Персонаж 1'));
bot.action('char_2', (ctx) => handleCharacterSelection(ctx, 'Персонаж 2'));
bot.action('char_3', (ctx) => handleCharacterSelection(ctx, 'Персонаж 3'));

function handleCharacterSelection(ctx, characterName) {
    const userId = ctx.from.id;
    userSessions[userId] = { character: characterName, step: 'awaiting_question' };

    ctx.reply(`Ты выбрал: ${characterName}. Приветствую тебя! Теперь задай свой вопрос.`);
    ctx.answerCbQuery(); // Remove loading state from button
}

// Handle text messages (questions)
bot.on('text', (ctx) => {
    const userId = ctx.from.id;
    const session = userSessions[userId];

    if (session && session.step === 'awaiting_question') {
        const question = ctx.message.text;
        const character = session.character;
        const username = ctx.from.username ? `@${ctx.from.username}` : `ID: ${userId}`;

        // Forward to admin
        if (ADMIN_ID) {
            const adminMessage = `📩 Новый вопрос!\n👤 От: ${username}\n🎭 Персонаж: ${character}\n❓ Вопрос: ${question}`;
            bot.telegram.sendMessage(ADMIN_ID, adminMessage);
            ctx.reply('Твой вопрос отправлен администратору!');
        } else {
            console.error('ADMIN_ID not set in .env');
            ctx.reply('Ошибка конфигурации: Админ не настроен.');
        }

        // Reset session or keep it? Let's reset step to avoid spamming just "questions" without re-selecting?
        // For now, let's allow asking more questions for the same character.
        // If we want to force re-selection:
        // delete userSessions[userId]; 
    } else {
        ctx.reply('Пожалуйста, нажмите /start и выберите персонажа, чтобы задать вопрос.');
    }
});

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

bot.launch();
console.log('Бот запущен...');
