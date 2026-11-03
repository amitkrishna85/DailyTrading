import datetime
import unittest

from _load import load

scan = load("trader-scanner", "scan")
entry = load("trader-entry", "entry")
exit = load("trader-exit", "exit")
timemachine = load("trader-timemachine", "timemachine")
size = load("trader-budget", "size")
check = load("trader-risk", "check")
alerts = load("trader-alerts", "alerts")
ticket = load("trader-broker", "ticket")


class TestIndiaMarket(unittest.TestCase):
    def test_keep_ns_symbols_as_they_are(self):
        # 1. Keep .NS and .BO symbols as they are (do not convert . to -)
        self.assertEqual(scan.to_yahoo("RELIANCE.NS"), "RELIANCE.NS")
        self.assertEqual(scan.to_yahoo("TCS.BO"), "TCS.BO")
        self.assertEqual(scan.to_yahoo("BRK.B"), "BRK-B")  # US tickers still convert

        self.assertEqual(entry.yahoo_symbol("RELIANCE.NS"), "RELIANCE.NS")
        self.assertEqual(entry.yahoo_symbol("TATAMOTORS.NS"), "TATAMOTORS.NS")
        self.assertEqual(entry.yahoo_symbol("BRK.B"), "BRK-B")

        self.assertIn("RELIANCE.NS", timemachine.chart_url("RELIANCE.NS"))
        self.assertIn("BRK-B", timemachine.chart_url("BRK.B"))

        self.assertIn("RELIANCE.NS", alerts.yahoo_url("RELIANCE.NS"))
        self.assertIn("BRK-B", alerts.yahoo_url("BRK.B"))

        # Verify symbol identification
        self.assertTrue(scan.is_india("RELIANCE.NS"))
        self.assertTrue(entry.is_india("INFY.NS"))
        self.assertTrue(exit.is_india("TCS.BO"))
        self.assertTrue(timemachine.is_india("WIPRO.NS"))
        self.assertTrue(size.is_india("HDFCBANK.NS"))
        self.assertTrue(check.is_india("SBIN.NS"))
        self.assertTrue(alerts.is_india("ICICIBANK.NS"))
        self.assertTrue(ticket.is_india("KOTAKBANK.NS"))

        self.assertFalse(scan.is_india("TSLA"))
        self.assertFalse(check.is_india("AAPL"))

    def test_indian_market_hours_and_time(self):
        # 2. Open 09:15, close 15:30 (IST: UTC + 5:30)
        self.assertEqual(scan.OPEN_NSE, datetime.time(9, 15))
        self.assertEqual(scan.CLOSE_NSE, datetime.time(15, 30))
        self.assertEqual(entry.OPEN_NSE, datetime.time(9, 15))
        self.assertEqual(entry.CLOSE_NSE, datetime.time(15, 30))
        self.assertEqual(exit.OPEN_NSE, datetime.time(9, 15))
        self.assertEqual(exit.CLOSE_NSE, datetime.time(15, 30))
        self.assertEqual(timemachine.OPEN_NSE, 555)  # 9 * 60 + 15
        self.assertEqual(timemachine.CLOSE_NSE, 930)  # 15 * 60 + 30
        self.assertEqual(timemachine.SESSION_BARS_NSE, 75)  # (930 - 555) / 5 = 75 bars
        self.assertEqual(check.OPEN_NSE, datetime.time(9, 15))
        self.assertEqual(check.CLOSE_NSE, datetime.time(15, 30))
        self.assertEqual(alerts.OPEN_NSE, datetime.time(9, 15))
        self.assertEqual(alerts.CLOSE_NSE, datetime.time(15, 30))

        # Check session function on normal trading day
        d = datetime.date(2026, 11, 2)  # Monday
        s = entry.session(d, is_in=True)
        self.assertEqual(s, (datetime.time(9, 15), datetime.time(15, 30)))

        # Check market status in alerts
        now_ist = alerts.parse_now("2026-11-02 10:00", is_in=True)
        st = alerts.market_status(now_ist, is_in=True)
        self.assertTrue(st["open"])
        self.assertEqual(st["market"], "NSE")
        self.assertEqual(st["opens"], "09:15")
        self.assertEqual(st["closes"], "15:30")

    def test_nse_holiday_list(self):
        # 3. Use the NSE holiday list
        for h in ("2026-01-26", "2026-03-03", "2026-10-02", "2026-11-10", "2026-12-25"):
            d = datetime.date.fromisoformat(h)
            is_trade, reason = entry.trading_day(d, is_in=True)
            self.assertFalse(is_trade, "Expected %s to be an NSE holiday" % h)
            self.assertIn("NSE holiday", reason)

        # US holidays (like Thanksgiving or Martin Luther King Day) are NOT NSE holidays
        mlk = datetime.date(2026, 1, 19)
        self.assertTrue(entry.trading_day(mlk, is_in=True)[0])
        self.assertFalse(entry.trading_day(mlk, is_in=False)[0])

    def test_close_every_day_trade_by_3_15(self):
        # 4. Close every day trade by 15:15 (3:15)
        # In trader-exit
        day = datetime.date(2026, 11, 2)
        entry_time = datetime.time(9, 30)
        self.assertEqual(exit.resolve_flat_by(day, None, {}, entry_time, is_in=True)[0], "15:15")
        self.assertEqual(exit.resolve_flat_by(day, None, {}, entry_time, is_in=False)[0], "15:55")

        # In trader-budget
        plan_in = {
            "symbol": "RELIANCE.NS",
            "entry": 2500.0,
            "stop": 2480.0,
            "target": 2540.0,
            "risk_per_share": 20.0,
            "r_multiple": 2.0,
            "date": "2026-11-02",
        }
        res_budget = size.size_trade(plan_in, {"budget": 100000, "max_loss_per_trade_usd": 1000},
                                     today="2026-11-02")
        self.assertEqual(res_budget["flat_by"], "15:15")
        order = size.bracket_order(res_budget)
        self.assertEqual(order["plan"]["flat_by"], "15:15")

        # In trader-alerts
        rules = alerts.rules_from_plan(plan_in)
        flat_rule = [r for r in rules if r["id"] == "reliance.ns-flat-by"][0]
        self.assertEqual(flat_rule["at"], "15:15")

    def test_risk_check_indian_market(self):
        # Ticker validation accepts .NS
        self.assertTrue(check.TICKER.match("RELIANCE.NS"))
        self.assertTrue(check.TICKER.match("TATAMOTORS.NS"))
        self.assertTrue(check.TICKER.match("TCS.BO"))

        # Risk check on holiday blocks order
        order = {
            "symbol": "RELIANCE.NS",
            "side": "buy",
            "qty": "10",
            "type": "market",
            "time_in_force": "day",
            "order_class": "bracket",
            "stop_loss_stop_price": "2480",
            "take_profit_limit_price": "2540",
            "plan": {"entry": 2500, "stop": 2480, "target": 2540, "max_loss": 200, "flat_by": "15:15"}
        }
        res_holiday = check.check([order], {"budget": 100000}, now=check.parse_now("2026-01-26 10:00", is_in=True))
        self.assertEqual(res_holiday["block"], 1)
        self.assertEqual(res_holiday["results"][0]["verdict"], "BLOCK")
        self.assertIn("NSE holiday", " ".join(res_holiday["results"][0]["reasons"]))

        cfg = {"budget": 100000, "max_order_usd": 50000, "max_loss_per_trade_usd": 500, "max_daily_loss_usd": 1000}
        res_open = check.check([order], cfg, now=check.parse_now("2026-11-02 10:00", is_in=True))
        self.assertEqual(res_open["pass"], 1)
        self.assertEqual(res_open["results"][0]["verdict"], "PASS")

        # After 15:30 close blocks new entry
        res_late = check.check([order], cfg, now=check.parse_now("2026-11-02 15:35", is_in=True))
        self.assertEqual(res_late["block"], 1)
        self.assertEqual(res_late["results"][0]["verdict"], "BLOCK")


if __name__ == "__main__":
    unittest.main()
