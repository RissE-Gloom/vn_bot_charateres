require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');

const bot = new Telegraf(process.env.BOT_TOKEN);
const ADMIN_ID = process.env.ADMIN_ID;

const CHARACTERS = {
    "Фрейя": {
        "prompt": "Приветствую. Ну посмотрим, что у тебя за вопрос. Только не тяни время — у меня его мало. Вот уж не думала, что кто‑то осмелится обратиться ко мне напрямую. Ну, что ж, говори.",
        "response": "..."
    },
    "Бернард": {
        "prompt": "Рад встрече. Внимательно слушаю твой вопрос. Не спеши, подумай, что хочешь узнать. Ты обратился ко мне — значит, ищешь совета. Я тебя слушаю.",
        "response": "..."
    },
    "Ной": {
        "prompt": "Здравствуй. Ты застал меня за чтением. В книгах всё просто: злодеи проигрывают, а хорошие герои находят утешение. Жаль, что жизнь устроена иначе... Прости, что-то я разговорился. Ты хотел о чём-то спросить?",
        "response": "..."
    },
    "Лукас": {
        "prompt": "Вижу, ты решил потратить моё время. Оно дорого стоит, так что формулируй вопрос чётко. Что ж, у тебя есть шанс получить ответ от меня. Не трать его зря.",
        "response": "..."
    },
    "Адриан": {
        "prompt": "Каждая беседа — это риск. Каждое слово может стать оружием. Я научился этому ценой крови — своей и чужой. Прежде чем задать свой вопрос, подумай, готов ли ты нести последствия услышанного. Теперь спрашивай. ",
        "response": "..."
    },
    "Лоран": {
        "prompt": "Лоран Кавендиш. Ваше любопытство мне понятно — многих интересуют те, кто держит будущее в своих руках. Не разочаруйте меня банальностями. Ваш вопрос?",
        "response": "..."
    },
    "Лэйн": {
        "prompt": "Слышишь? Тишина... она всегда звучит громче всего перед тем, как я начинаю играть. Не бойся, я сыграю и для тебя. Твой вопрос будет моей прелюдией. Начинай.",
        "response": "..."
    },
    "Разработчикам": {
        "prompt": "Задайте свой вопрос нам и мы постараемся на него ответить.",
        "response": "..."
    }
};

// Store user sessions in memory (for simple logic)
const userSessions = {};

// Start command
bot.start((ctx) => {
    const names = Object.keys(CHARACTERS);
    const buttons = [];
    for (let i = 0; i < names.length; i += 3) {
        const row = names.slice(i, i + 3).map(name => Markup.button.callback(name, `char_${name}`));
        buttons.push(row);
    }
    ctx.reply('Привет! Выберите персонажа:', Markup.inlineKeyboard(buttons));
});

// Character selection actions
bot.action(/^char_(.+)$/, (ctx) => {
    const characterName = ctx.match[1];
    handleCharacterSelection(ctx, characterName);
});

function handleCharacterSelection(ctx, characterName) {
    const userId = ctx.from.id;
    const character = CHARACTERS[characterName];

    if (!character) {
        ctx.reply('Ошибка: Персонаж не найден.');
        return ctx.answerCbQuery();
    }

    userSessions[userId] = { character: characterName, step: 'awaiting_question' };

    ctx.reply(character.prompt);
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
            ctx.reply('Скоро ты получишь ответ, ожидай.');
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
