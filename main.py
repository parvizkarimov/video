import os
import asyncio
import subprocess
from aiogram import Bot, Dispatcher, F
from aiogram.types import Message, FSInputFile
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import StatesGroup, State
from aiogram.filters import CommandStart

BOT_TOKEN = os.getenv("BOT_TOKEN")
if not BOT_TOKEN:
    raise ValueError("BOT_TOKEN environment variable is not set. Please set it in Railway.")

bot = Bot(token=BOT_TOKEN)
dp = Dispatcher()

class Form(StatesGroup):
    waiting_for_mp3 = State()
    waiting_for_image = State()

@dp.message(CommandStart())
async def start_handler(message: Message, state: FSMContext):
    await message.answer("Assalomu alaykum! Menga MP3 qo'shiq yuboring, men uni klangbild yordamida chiroyli videoga aylantiraman.")
    await state.set_state(Form.waiting_for_mp3)

@dp.message(Form.waiting_for_mp3, F.audio)
async def process_audio(message: Message, state: FSMContext):
    file_id = message.audio.file_id
    file = await bot.get_file(file_id)
    mp3_path = f"{message.from_user.id}_audio.mp3"
    await bot.download_file(file.file_path, mp3_path)
    
    await state.update_data(mp3_path=mp3_path)
    await message.answer("Qo'shiq qabul qilindi. Endi unga mos keladigan fon rasmini (JPG/PNG) yuboring.")
    await state.set_state(Form.waiting_for_image)

@dp.message(Form.waiting_for_image, F.photo)
async def process_photo(message: Message, state: FSMContext):
    file_id = message.photo[-1].file_id
    file = await bot.get_file(file_id)
    img_path = f"{message.from_user.id}_image.jpg"
    await bot.download_file(file.file_path, img_path)
    
    data = await state.get_data()
    mp3_path = data['mp3_path']
    out_path = f"{message.from_user.id}_video.mp4"
    
    await message.answer("Klangbild yordamida video yaratilmoqda. Bu biroz vaqt olishi mumkin, iltimos kuting...")
    
    # Run klangbild in a thread to not block the asyncio event loop
    def run_klangbild():
        cmd = ["python", "-m", "klangbild", "--audio", mp3_path, "--background", img_path, "--output", out_path]
        return subprocess.run(cmd, capture_output=True, text=True)
    
    loop = asyncio.get_running_loop()
    result = await loop.run_in_executor(None, run_klangbild)
    
    if result.returncode == 0 and os.path.exists(out_path):
        video = FSInputFile(out_path)
        await message.answer_video(video, caption="Sizning videongiz tayyor!")
    else:
        await message.answer(f"Video yaratishda xatolik yuz berdi:\n{result.stderr}")
        
    # Cleanup files
    for p in [mp3_path, img_path, out_path]:
        if os.path.exists(p):
            os.remove(p)
            
    await state.clear()
    await message.answer("Yangi video yaratish uchun menga yana MP3 yuboring.")
    await state.set_state(Form.waiting_for_mp3)

@dp.message()
async def process_any(message: Message):
    await message.answer("Iltimos, avval /start buyrug'ini bering yoki kutilayotgan faylni yuboring.")

async def main():
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())
