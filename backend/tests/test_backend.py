import os
import sys
import unittest

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from backend.routers import config_router, pipeline_router
from backend.services import user_manager


class TestBackendDirect(unittest.TestCase):
    def test_user_manager(self):
        user_manager.ensure_users_dir()
        users = user_manager.list_users()
        usernames = [u["username"] for u in users]
        self.assertIn("default", usernames)
        self.assertIn("admin", usernames)

        # Create user
        u = user_manager.create_user("trader_bob")
        self.assertEqual(u, "trader_bob")
        updated_users = [item["username"] for item in user_manager.list_users()]
        self.assertIn("trader_bob", updated_users)

        # Config isolation
        cfg = user_manager.get_user_config("trader_bob")
        self.assertIn("budget", cfg)
        cfg["budget"] = 99999
        user_manager.save_user_config("trader_bob", cfg)

        self.assertEqual(user_manager.get_user_config("trader_bob")["budget"], 99999)
        self.assertNotEqual(user_manager.get_user_config("default")["budget"], 99999)

    def test_market_status(self):
        status = config_router.get_market_status()
        self.assertIn("india", status)
        self.assertIn("status", status["india"])
        self.assertEqual(status["india"]["currency"], "INR")
        self.assertEqual(status["india"]["currency_symbol"], "₹")

    def test_pipeline_status(self):
        st = pipeline_router.get_pipeline_status("default")
        self.assertEqual(st["user"], "default")


if __name__ == "__main__":
    unittest.main()
