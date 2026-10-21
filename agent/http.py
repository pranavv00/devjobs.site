"""Bounded feed requests with connection reuse, pacing and transient retries."""
import time
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from urllib.parse import urlsplit

import httpx

from agent.config import MAX_RESPONSE_BYTES, MAX_RETRIES, REQUEST_INTERVAL_SECONDS, USER_AGENT


class FeedClient:
    def __init__(self, transport=None, sleep=time.sleep, interval=REQUEST_INTERVAL_SECONDS):
        self.client = httpx.Client(
            headers={"User-Agent": USER_AGENT, "Accept": "application/json, application/rss+xml, application/xml"},
            timeout=httpx.Timeout(25, connect=10), follow_redirects=True,
            max_redirects=3, transport=transport,
        )
        self.sleep = sleep
        self.interval = interval
        self.last_request = {}
        self.requests = 0

    def __enter__(self):
        return self

    def __exit__(self, *_):
        self.client.close()

    def get(self, url, params=None):
        host = urlsplit(url).netloc
        for attempt in range(MAX_RETRIES + 1):
            elapsed = time.monotonic() - self.last_request.get(host, 0)
            if elapsed < self.interval:
                self.sleep(self.interval - elapsed)
            try:
                self.last_request[host] = time.monotonic()
                self.requests += 1
                with self.client.stream("GET", url, params=params) as response:
                    if response.status_code == 429 or response.status_code in {500, 502, 503, 504}:
                        delay = self.retry_delay(response.headers.get("Retry-After"), attempt)
                        # Never retry earlier than Retry-After; defer long waits to the next run.
                        if attempt < MAX_RETRIES and delay <= 30:
                            self.sleep(delay)
                            continue
                    response.raise_for_status()
                    chunks, size = [], 0
                    for chunk in response.iter_bytes():
                        size += len(chunk)
                        if size > MAX_RESPONSE_BYTES:
                            raise ValueError("Feed response exceeds the configured size limit")
                        chunks.append(chunk)
                    return httpx.Response(
                        response.status_code, headers={key: value for key, value in response.headers.items()
                                                       if key.lower() not in {"content-encoding", "content-length", "transfer-encoding"}},
                        content=b"".join(chunks), request=response.request,
                    )
            except httpx.TransportError:
                if attempt == MAX_RETRIES:
                    raise
                self.sleep(2 ** attempt)
        raise RuntimeError("Feed retry budget exhausted")

    @staticmethod
    def retry_delay(value, attempt):
        if value:
            try:
                return max(0, float(value))
            except ValueError:
                try:
                    date = parsedate_to_datetime(value)
                    return max(0, (date - datetime.now(timezone.utc)).total_seconds())
                except (ValueError, TypeError, OverflowError):
                    pass
        return 2 ** attempt

    def json(self, url, params=None):
        data = self.get(url, params=params).json()
        if isinstance(data, dict) and data.get("success") is False:
            raise ValueError("Source returned an unsuccessful API response")
        return data
