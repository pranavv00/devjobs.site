"""Synthetic contract fixtures based on each source's public response schema."""
import gzip
import json
import unittest
from datetime import datetime, timezone
from unittest.mock import patch

import httpx

from agent.http import FeedClient
from agent.main import merge_jobs, process_all_jobs
from agent.normalize import description_sections, is_developer_role, normalize_job, salary_details
from agent.scraper import SOURCES, scrape_all_jobs

NOW = datetime(2026, 10, 21, 12, tzinfo=timezone.utc)
POSTED = '2026-10-20T10:00:00Z'
DESCRIPTION = '<h2>Requirements</h2><ul><li>Python and SQL</li></ul><h2>Benefits</h2><p>Paid leave</p><h2>About us</h2><p>A software team.</p>'
BASE = {'title': 'Python developer', 'company': 'Example', 'url': 'https://example.com/jobs/1', 'posted_at': POSTED, 'description': DESCRIPTION}
RSS = f'''<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/"><channel><item><title>Example: Senior Python developer</title><link>https://weworkremotely.com/remote-jobs/example</link><guid>wwr-1</guid><pubDate>Tue, 20 Oct 2026 10:00:00 GMT</pubDate><description>Short description</description><content:encoded><![CDATA[{DESCRIPTION}]]></content:encoded><region>USA, Canada</region><type>Full-Time</type></item></channel></rss>'''
JOBICY = {'id': 1, 'url': 'https://jobicy.com/jobs/1', 'jobTitle': 'Python developer', 'companyName': 'Example', 'jobDescription': DESCRIPTION, 'pubDate': POSTED, 'jobGeo': 'Canada', 'jobType': ['Full-Time'], 'jobLevel': 'Senior', 'jobIndustry': ['Software Engineering'], 'salaryMin': 55, 'salaryMax': 75, 'salaryCurrency': 'CAD', 'salaryPeriod': 'hourly'}
HIMALAYAS = {'guid': 'https://himalayas.app/companies/example/jobs/python', 'applicationLink': 'https://example.com/apply?ref=himalayas', 'title': 'Python developer', 'companyName': 'Example', 'description': DESCRIPTION, 'pubDate': int(datetime(2026, 10, 20, tzinfo=timezone.utc).timestamp()), 'expiryDate': int(datetime(2026, 11, 1, tzinfo=timezone.utc).timestamp()), 'locationRestrictions': ['Canada'], 'timezoneRestrictions': [-8, -7, -6], 'employmentType': 'Contractor', 'minSalary': 6000, 'maxSalary': 8000, 'salaryPeriod': 'monthly', 'currency': 'CAD'}
ARBEITNOW = {'slug': 'python-developer', 'title': 'Python developer', 'company_name': 'Example', 'description': DESCRIPTION, 'url': 'https://www.arbeitnow.com/jobs/python', 'remote': True, 'created_at': HIMALAYAS['pubDate'], 'location': 'Berlin', 'tags': ['Python'], 'job_types': ['Vollzeit']}


def fixture(request):
    host = request.url.host
    if host == 'weworkremotely.com':
        return httpx.Response(200, text=RSS)
    if host == 'remotive.com':
        return httpx.Response(200, json={'jobs': [{'id': 5, 'title': 'Python developer', 'company_name': 'Example', 'url': 'https://remotive.com/remote-jobs/5', 'description': DESCRIPTION, 'publication_date': POSTED, 'candidate_required_location': 'USA, Canada', 'job_type': 'full_time', 'tags': ['Python', 'PostgreSQL'], 'salary': 'USD 120,000 / year'}]})
    if host == 'remoteok.com':
        return httpx.Response(200, json=[{'legal': 'source notice'}, {'id': 7, 'position': 'DevOps Engineer', 'company': 'Example', 'url': 'https://remoteok.com/7', 'description': DESCRIPTION, 'date': POSTED, 'tags': ['devops', 'kubernetes'], 'salary_min': 100000, 'salary_max': 150000, 'location': 'Europe'}])
    if host == 'www.workingnomads.com':
        return httpx.Response(200, json=[{'title': 'Python developer', 'company_name': 'Actual Employer', 'url': 'https://www.workingnomads.com/job/go/8/', 'description': DESCRIPTION, 'pub_date': POSTED, 'tags': 'python,sql', 'category_name': 'Development', 'location': 'UK'}])
    if host == 'jobicy.com':
        return httpx.Response(200, json={'jobs': [JOBICY], 'nextCursor': None, 'success': True})
    if host == 'himalayas.app':
        return httpx.Response(200, json={'jobs': [HIMALAYAS], 'nextCursor': None})
    if host in {'www.arbeitnow.com', 'www.arbeitnow.co.uk'}:
        return httpx.Response(200, json={'data': [{**ARBEITNOW, 'url': f'https://{host}/jobs/python'}, {**ARBEITNOW, 'remote': False}, {**ARBEITNOW, 'title': 'Marketing manager'}], 'links': {'next': None}})
    raise AssertionError(f'Unexpected request: {request.url}')


class SourceTests(unittest.TestCase):
    def scrape(self, sources=None, handler=fixture, **kwargs):
        report = {}
        with FeedClient(transport=httpx.MockTransport(handler), interval=0, sleep=lambda _: None) as client:
            jobs = scrape_all_jobs(sources=sources, client=client, now=NOW, report=report, **kwargs)
        return jobs, report

    def test_all_eight_sources_and_rich_fields(self):
        jobs, report = self.scrape()
        self.assertEqual(set(report), set(SOURCES))
        self.assertTrue(all(item['status'] == 'ok' for item in report.values()))
        jobs = merge_jobs([], jobs, now=NOW)
        self.assertEqual(len(jobs), 8)
        by_source = {job['source']: job for job in jobs}
        self.assertEqual(by_source['WeWorkRemotely']['applicant_countries'], ['US', 'CA'])
        self.assertIn('Paid leave', by_source['WeWorkRemotely']['description'])
        self.assertEqual(by_source['WorkingNomads']['company'], 'Actual Employer')
        self.assertEqual(by_source['WorkingNomads']['tags'], ['python', 'sql'])
        self.assertEqual(by_source['Arbeitnow']['employment_type'], 'FULL_TIME')
        self.assertEqual(by_source['Arbeitnow']['applicant_countries'], [])
        self.assertEqual(by_source['Jobicy']['salary_period'], 'HOUR')
        self.assertEqual(by_source['Jobicy']['salary_currency'], 'CAD')
        self.assertEqual(by_source['Jobicy']['experience_level'], 'Senior')
        self.assertEqual(by_source['Himalayas']['apply_url'], HIMALAYAS['applicationLink'])
        self.assertEqual(by_source['Himalayas']['posted_at'], '')
        self.assertTrue(by_source['Himalayas']['updated_at'])
        self.assertEqual(by_source['Himalayas']['timezone_restrictions'], ['-8', '-7', '-6'])
        self.assertTrue(by_source['Himalayas']['valid_through'].startswith('2026-11-01'))
        self.assertFalse(by_source['Himalayas']['allow_syndication'])
        self.assertFalse(by_source['Remotive']['allow_syndication'])
        self.assertEqual(by_source['RemoteOK']['salary_currency'], '')
        self.assertNotIn('$', by_source['RemoteOK']['salary'])
        self.assertEqual(report['Arbeitnow']['skipped'], 2)

    def test_cursor_pagination_preserves_params_and_opaque_cursor(self):
        requests = []
        def handler(request):
            requests.append(request)
            if len(requests) == 1:
                return httpx.Response(200, json={'jobs': [JOBICY], 'nextCursor': 'opaque+/=&?'})
            return httpx.Response(200, json={'jobs': [{**JOBICY, 'id': 2, 'url': 'https://jobicy.com/jobs/2'}], 'nextCursor': None})
        jobs, report = self.scrape(['Jobicy'], handler)
        self.assertEqual(len(jobs), 2)
        self.assertEqual(requests[1].url.params['cursor'], 'opaque+/=&?')
        self.assertEqual(requests[1].url.params['count'], '100')
        self.assertEqual(report['Jobicy']['requests'], 2)

    def test_pagination_cap_reports_partial_coverage(self):
        jobs, report = self.scrape(['Jobicy'], lambda _: httpx.Response(200, json={'jobs': [JOBICY], 'nextCursor': 'next'}), max_pages=1)
        self.assertEqual(len(jobs), 1)
        self.assertEqual(report['Jobicy']['status'], 'capped')

    def test_repeated_cursor_retains_successful_pages(self):
        with self.assertLogs('agent.scraper', level='ERROR'):
            jobs, report = self.scrape(['Jobicy'], lambda _: httpx.Response(200, json={'jobs': [JOBICY], 'nextCursor': 'repeated'}))
        self.assertEqual(report['Jobicy']['status'], 'partial')
        self.assertEqual(len(merge_jobs([], jobs, now=NOW)), 1)
        self.assertEqual(report['Jobicy']['requests'], 2)

    def test_arbitrary_pagination_url_is_never_requested(self):
        seen = []
        def handler(request):
            seen.append(request.url.host)
            return httpx.Response(200, json={'data': [ARBEITNOW], 'links': {'next': 'https://attacker.example/next'}})
        with self.assertLogs('agent.scraper', level='ERROR'):
            jobs, report = self.scrape(['Arbeitnow'], handler)
        self.assertEqual(seen, ['www.arbeitnow.com'])
        self.assertEqual(report['Arbeitnow']['status'], 'partial')
        self.assertEqual(len(jobs), 1)

    def test_failure_does_not_abort_other_sources(self):
        def handler(request):
            return httpx.Response(503) if request.url.host == 'jobicy.com' else fixture(request)
        with self.assertLogs('agent.scraper', level='ERROR'):
            jobs, report = self.scrape(['Jobicy', 'Remotive'], handler)
        self.assertEqual(report['Jobicy']['status'], 'error')
        self.assertEqual(report['Remotive']['status'], 'ok')
        self.assertEqual(len(jobs), 1)

    def test_missing_himalayas_application_link_is_not_published(self):
        jobs, report = self.scrape(['Himalayas'], lambda _: httpx.Response(200, json={'jobs': [{**HIMALAYAS, 'applicationLink': 'javascript:alert(1)'}]}))
        self.assertEqual(jobs, [])
        self.assertEqual(report['Himalayas']['skipped'], 1)

    def test_invalid_rows_do_not_discard_valid_records(self):
        jobs, report = self.scrape(['Jobicy'], lambda _: httpx.Response(200, json={'jobs': [None, {**JOBICY, 'companyName': None}, JOBICY]}))
        self.assertEqual(len(jobs), 1)
        self.assertEqual(report['Jobicy']['skipped'], 1)

    def test_malformed_feed_is_an_error_not_empty_success(self):
        with self.assertLogs('agent.scraper', level='ERROR'):
            _, report = self.scrape(['Jobicy'], lambda _: httpx.Response(200, json={'jobs': {}}))
        self.assertEqual(report['Jobicy']['status'], 'error')

    def test_numbered_pagination(self):
        pages = []
        def handler(request):
            page = int(request.url.params['page'])
            pages.append(page)
            return httpx.Response(200, json={'data': [{**ARBEITNOW, 'slug': str(page), 'url': f'https://www.arbeitnow.com/jobs/{page}'}], 'links': {'next': 'https://www.arbeitnow.com/api/job-board-api?page=2' if page == 1 else None}})
        jobs, report = self.scrape(['Arbeitnow'], handler)
        self.assertEqual(pages, [1, 2])
        self.assertEqual(len(jobs), 2)
        self.assertEqual(report['Arbeitnow']['status'], 'ok')

    def test_developer_relevance_uses_title_and_source_tags(self):
        for title in ['Frontend Engineer', 'DevOps Engineer', 'Senior Data Scientist', 'Softwareentwickler', 'Python developer', 'QA engineer']:
            self.assertTrue(is_developer_role(title), title)
        for title in ['Business Development Manager', 'Technical Recruiter', 'Sales Engineer', 'Mechanical Engineer']:
            self.assertFalse(is_developer_role(title, ['engineering']), title)
        self.assertTrue(is_developer_role('Senior engineer', ['software engineering']))

    def test_sections_stop_at_other_headings(self):
        self.assertEqual(description_sections(DESCRIPTION), {'requirements': ['Python and SQL'], 'benefits': ['Paid leave']})
        self.assertEqual(description_sections('<p>We have benefits and requirements.</p>'), {})

    def test_salary_is_structured_only_from_source_fields(self):
        self.assertEqual(salary_details('bad', None), {})
        self.assertEqual(salary_details(True, float('nan')), {})
        self.assertEqual(salary_details(200, 100), {})
        salary = salary_details('50', '75', 'eur', 'hourly')
        self.assertEqual(salary['salary'], 'EUR 50 – 75 / hour')
        self.assertEqual(salary_details(None, 75, 'GBP', 'monthly')['salary'], 'GBP Up to 75 / month')
        self.assertEqual(normalize_job('Example', **{**BASE, 'description': '<p>$500 equipment budget</p>'}, now=NOW)['salary'], '')

    def test_tracking_duplicates_keep_saved_url_and_first_seen(self):
        original = {**BASE, 'source': 'Example', 'url': 'https://example.com/jobs/1?utm_source=old', 'first_seen_at': POSTED, 'last_seen_at': '2026-10-21T09:00:00Z'}
        update = {**BASE, 'source': 'Example', 'url': 'https://example.com/jobs/1?utm_source=new', 'last_seen_at': NOW.isoformat()}
        jobs = merge_jobs([original], [update], now=NOW)
        self.assertEqual(len(jobs), 1)
        self.assertEqual(jobs[0]['url'], original['url'])
        self.assertEqual(jobs[0]['first_seen_at'], POSTED)
        self.assertEqual(jobs[0]['last_seen_at'], NOW.isoformat())

    def test_null_source_ids_do_not_merge_unrelated_jobs(self):
        jobs, _ = self.scrape(['Jobicy'], lambda _: httpx.Response(200, json={'jobs': [
            {**JOBICY, 'id': None}, {**JOBICY, 'id': None, 'url': 'https://jobicy.com/jobs/2'}
        ]}))
        self.assertEqual(len(merge_jobs([], jobs, now=NOW)), 2)

    def test_explicit_expiry_removes_previously_active_record(self):
        self.assertEqual(merge_jobs([BASE], [{**BASE, 'valid_through': POSTED}], now=NOW), [])
        job = normalize_job('Example', **BASE, now=NOW, valid_through='2026-11-01')
        self.assertEqual(len(merge_jobs([], [job], now=NOW)), 1)

    def test_same_source_id_deduplicates_changed_listing_urls(self):
        jobs = merge_jobs([{**BASE, 'source': 'Example', 'source_id': '1'}], [{**BASE, 'source': 'Example', 'source_id': '1', 'url': 'https://example.com/jobs/new'}], now=NOW)
        self.assertEqual(len(jobs), 1)
        self.assertEqual(jobs[0]['url'], 'https://example.com/jobs/new')

    def test_same_title_at_different_sources_is_not_blindly_merged(self):
        self.assertEqual(len(merge_jobs([BASE], [{**BASE, 'url': 'https://other.example/jobs/1'}], now=NOW)), 2)

    def test_only_invalid_recent_incoming_does_not_write(self):
        with patch('agent.main.load_existing_jobs', return_value=[BASE]), patch('agent.main.scrape_all_jobs', return_value=[{**BASE, 'posted_at': ''}]), patch('agent.main.save_jobs') as save:
            with self.assertRaises(RuntimeError):
                process_all_jobs()
            save.assert_not_called()

    def test_dry_run_reports_without_writing_snapshot(self):
        import tempfile
        from pathlib import Path
        with tempfile.TemporaryDirectory() as directory:
            report_path = Path(directory) / 'report.json'
            with patch('agent.main.load_existing_jobs', return_value=[]), patch('agent.main.scrape_all_jobs', return_value=[{**BASE, 'posted_at': datetime.now(timezone.utc).isoformat()}]), patch('agent.main.save_jobs') as save:
                result = process_all_jobs(test_mode=True, report_path=report_path)
                self.assertEqual(len(result), 1)
                save.assert_not_called()
            report = json.loads(report_path.read_text())
            self.assertTrue(report['dry_run'])
            self.assertEqual(report['recent_incoming'], 1)
            self.assertEqual(report['coverage']['description'], 1)

    def test_failure_report_is_written_before_exit(self):
        import tempfile
        from pathlib import Path
        with tempfile.TemporaryDirectory() as directory:
            report_path = Path(directory) / 'report.json'
            with patch('agent.main.load_existing_jobs', return_value=[BASE]), patch('agent.main.scrape_all_jobs', return_value=[]), patch('agent.main.save_jobs') as save:
                with self.assertRaises(RuntimeError):
                    process_all_jobs(report_path=report_path)
                save.assert_not_called()
            self.assertEqual(json.loads(report_path.read_text())['incoming'], 0)


class HttpTests(unittest.TestCase):
    def test_retry_after_is_honored(self):
        calls, waits = [], []
        def handler(request):
            calls.append(request)
            return httpx.Response(429, headers={'Retry-After': '2'}) if len(calls) == 1 else httpx.Response(200, json={'jobs': []})
        with FeedClient(transport=httpx.MockTransport(handler), interval=0, sleep=waits.append) as client:
            self.assertEqual(client.json('https://example.com/feed'), {'jobs': []})
        self.assertEqual(waits, [2])
        self.assertEqual(len(calls), 2)

    def test_long_retry_after_is_deferred_without_early_retry(self):
        waits = []
        with FeedClient(transport=httpx.MockTransport(lambda _: httpx.Response(429, headers={'Retry-After': '600'})), interval=0, sleep=waits.append) as client:
            with self.assertRaises(httpx.HTTPStatusError):
                client.json('https://example.com/feed')
            self.assertEqual(client.requests, 1)
        self.assertEqual(waits, [])

    def test_nonretryable_errors_and_oversized_responses(self):
        with FeedClient(transport=httpx.MockTransport(lambda _: httpx.Response(404)), interval=0) as client:
            with self.assertRaises(httpx.HTTPStatusError):
                client.get('https://example.com/feed')
            self.assertEqual(client.requests, 1)
        with FeedClient(transport=httpx.MockTransport(lambda _: httpx.Response(200, text='123456')), interval=0) as client, patch('agent.http.MAX_RESPONSE_BYTES', 5):
            with self.assertRaises(ValueError):
                client.get('https://example.com/feed')

    def test_gzip_response_is_not_decoded_twice(self):
        body = gzip.compress(json.dumps({'jobs': []}).encode())
        with FeedClient(transport=httpx.MockTransport(lambda _: httpx.Response(200, content=body, headers={'Content-Encoding': 'gzip'})), interval=0) as client:
            self.assertEqual(client.json('https://example.com/feed'), {'jobs': []})


if __name__ == '__main__':
    unittest.main()
