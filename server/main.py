from dotenv import load_dotenv
import asyncio

load_dotenv()

from init_db import init_db

asyncio.run(init_db())