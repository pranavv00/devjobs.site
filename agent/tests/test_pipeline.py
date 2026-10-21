import json
import tempfile
import unittest
from datetime import datetime, timezone
from pathlib import Path
from unittest.mock import patch
from agent.main import is_recent, merge_jobs, process_all_jobs, save_jobs, valid_job
from agent.scraper import applicant_countries, clean_html, parse_relative_date

NOW = datetime(2026, 10, 21, 12, tzinfo=timezone.utc)
JOB = {'title': 'Python engineer', 'company': 'Example', 'url': 'https://example.com/job/1', 'posted_at': '2026-10-20T10:00:00Z', 'description': '<p>Build software.</p>'}

class PipelineTests(unittest.TestCase):
    def test_locations_are_never_guessed_from_description(self):
        self.assertEqual(applicant_countries('USA, Canada'), ['US', 'CA'])
        self.assertEqual(applicant_countries('Worldwide'), [])
        self.assertEqual(applicant_countries('Europe, United States'), [])
        self.assertEqual(applicant_countries(None), [])

    def test_dates_preserve_microseconds_and_never_invent_freshness(self):
        self.assertEqual(parse_relative_date('2026-10-20T10:00:00.123456Z', now=NOW), '2026-10-20T10:00:00.123456+00:00')
        for value in ['', None, 'nonsense', '2027-01-01']:
            self.assertEqual(parse_relative_date(value, now=NOW), '')
        self.assertTrue(parse_relative_date('Wed, 21 Oct 2026 10:00:00 +0000', now=NOW).startswith('2026-10-21'))
        self.assertTrue(parse_relative_date('2 days ago', now=NOW).startswith('2026-10-19'))

    def test_freshness_window_rejects_unknown_future_and_expired(self):
        self.assertTrue(is_recent('2026-10-01', now=NOW))
        for value in ['', 'invalid', '2026-08-01', '2026-10-22']:
            self.assertFalse(is_recent(value, now=NOW))

    def test_dedup_and_missing_dates_preserve_original(self):
        result = merge_jobs([JOB], [{**JOB, 'posted_at': '', 'salary': '$100k'}], now=NOW)
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]['posted_at'], '2026-10-20T10:00:00+00:00')
        self.assertEqual(result[0]['salary'], '$100k')

    def test_invalid_jobs_are_rejected(self):
        self.assertFalse(valid_job({**JOB, 'url': 'javascript:alert(1)'}))
        self.assertFalse(valid_job({**JOB, 'company': None}))
        self.assertFalse(valid_job({**JOB, 'url': 'https://user:secret@example.com'}))
        self.assertEqual(merge_jobs([], [{**JOB, 'posted_at': ''}], now=NOW), [])

    def test_html_cleaning_removes_scripts_attributes_and_embeds(self):
        result = clean_html('<script>alert(1)</script><p onclick="bad()">Hello <img src=x onerror=bad()><strong>world</strong></p><iframe src=x></iframe>')
        self.assertNotIn('<script', result)
        self.assertNotIn('onclick', result)
        self.assertNotIn('<iframe', result)
        self.assertNotIn('<img', result)
        self.assertIn('<strong>world</strong>', result)

    def test_all_source_failure_does_not_write(self):
        with patch('agent.main.load_existing_jobs', return_value=[JOB]), patch('agent.main.scrape_all_jobs', return_value=[]), patch('agent.main.save_jobs') as save:
            with self.assertRaises(RuntimeError): process_all_jobs()
            save.assert_not_called()

    def test_atomic_write_and_failure_preserve_existing(self):
        with tempfile.TemporaryDirectory() as directory:
            target = Path(directory) / 'jobs.json'
            target.write_text('[{"old": true}]')
            with patch('agent.main.JOBS_FILE', target):
                with patch('agent.main.os.replace', side_effect=OSError('disk error')):
                    with self.assertRaises(OSError): save_jobs([JOB])
                self.assertEqual(json.loads(target.read_text()), [{'old': True}])
                self.assertEqual(list(Path(directory).glob('*.tmp')), [])
                save_jobs([JOB])
                self.assertEqual(json.loads(target.read_text()), [JOB])

if __name__ == '__main__':
    unittest.main()
