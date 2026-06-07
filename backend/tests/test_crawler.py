import pytest

from nursind.crawler import CrawlerError, InvalidCrawlerResponse, PayrollCrawler


class Response:
    def __init__(self, text="", content=b"", status_code=200):
        self.text = text
        self.content = content
        self.status_code = status_code

    def raise_for_status(self):
        return None


class Session:
    def __init__(self, responses):
        self.responses = iter(responses)

    def request(self, *_args, **_kwargs):
        return next(self.responses)


def crawler():
    return PayrollCrawler(
        "https://portal.test",
        "test@example.invalid",
        False,
        1,
        1,
        0,
    )


def test_crawler_logs_safe_request_milestones():
    entries = []
    instance = PayrollCrawler(
        "https://portal.test",
        "test@example.invalid",
        False,
        1,
        1,
        0,
        log_callback=lambda level, message: entries.append((level, message)),
    )
    session = Session([Response()])

    instance._request(
        session,
        "POST",
        "/safe-path",
        data={"j_password": "do-not-log"},
    )

    messages = " ".join(message for _, message in entries)
    assert "POST /safe-path" in messages
    assert "do-not-log" not in messages


def test_period_has_no_year_limit():
    crawler().validate_period(2000, 1)
    crawler().validate_period(3000, 12)


def test_rejects_invalid_month():
    with pytest.raises(CrawlerError):
        crawler().validate_period(2000, 13)


def test_download_validates_pdf_signature():
    month = "GENNAIO"
    session = Session(
        [
            Response(),
            Response(text=f'<a class="AFCLink" title="Disponibile {month} anno 2019"></a>'),
            Response(content=b"<html>not a pdf</html>"),
        ]
    )
    with pytest.raises(InvalidCrawlerResponse):
        crawler().download(session, 2019, 1, "user")


def test_download_returns_pdf():
    session = Session(
        [
            Response(),
            Response(text='<a class="AFCLink" title="Disponibile GENNAIO anno 2019"></a>'),
            Response(content=b"%PDF-1.7\ncontent"),
        ]
    )
    assert crawler().download(session, 2019, 1, "user").startswith(b"%PDF")
