"""
Test setup for server.py.

Two things server.py needs at import time that aren't available in a plain
CI environment:

1. MONGO_URL / DB_NAME / EMERGENT_LLM_KEY are read via os.environ[...]
   (not .get(...)) at module scope, so they must exist before import even
   though these tests never touch Mongo or Gemini. Dummy values are
   sufficient -- constructing an AsyncIOMotorClient doesn't connect until
   a query actually runs.

2. `emergentintegrations` is a private package from the emergent.sh build
   platform, not published to PyPI -- it can't be installed in a normal
   CI runner. It's only used inside the async _gemini_score() function,
   which none of these tests call, so it's safe to stub with a fake
   module rather than skip testing everything else in this file.
"""
import os
import sys
import types

os.environ.setdefault("MONGO_URL", "mongodb://localhost:27017")
os.environ.setdefault("DB_NAME", "test_db")
os.environ.setdefault("EMERGENT_LLM_KEY", "test-key-not-real")

if "emergentintegrations" not in sys.modules:
    fake_pkg = types.ModuleType("emergentintegrations")
    fake_llm = types.ModuleType("emergentintegrations.llm")
    fake_chat = types.ModuleType("emergentintegrations.llm.chat")

    class LlmChat:  # pragma: no cover - not exercised by these tests
        def __init__(self, *a, **k):
            pass

        def with_model(self, *a, **k):
            return self

        async def send_message(self, *a, **k):
            raise NotImplementedError("stubbed for testing -- not a real Gemini call")

    class UserMessage:  # pragma: no cover
        def __init__(self, *a, **k):
            pass

    fake_chat.LlmChat = LlmChat
    fake_chat.UserMessage = UserMessage
    fake_llm.chat = fake_chat
    fake_pkg.llm = fake_llm
    sys.modules["emergentintegrations"] = fake_pkg
    sys.modules["emergentintegrations.llm"] = fake_llm
    sys.modules["emergentintegrations.llm.chat"] = fake_chat

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
