import telebot
import os

TOKEN = os.environ.get("BOT_TOKEN")

bot = telebot.TeleBot(TOKEN)

@bot.message_handler(commands=['start'])
def start(msg):
    bot.send_message(msg.chat.id, "🤖 Bot online no Render!")

bot.infinity_polling()
