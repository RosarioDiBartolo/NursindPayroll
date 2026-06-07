import time

import requests
from bs4 import BeautifulSoup


MONTH_NAMES = (
    "GENNAIO",
    "FEBBRAIO",
    "MARZO",
    "APRILE",
    "MAGGIO",
    "GIUGNO",
    "LUGLIO",
    "AGOSTO",
    "SETTEMBRE",
    "OTTOBRE",
    "NOVEMBRE",
    "DICEMBRE",
)


class CrawlerError(Exception):
    pass


class AuthenticationError(CrawlerError):
    pass


class TemporaryCrawlerError(CrawlerError):
    pass


class InvalidCrawlerResponse(CrawlerError):
    pass


class PayrollCrawler:
    def __init__(
        self,
        base_url: str,
        email: str,
        verify_tls: bool,
        timeout: int,
        poll_attempts: int,
        poll_interval: int,
        log_callback=None,
    ):
        self.base_url = base_url.rstrip("/")
        self.email = email
        self.verify_tls = verify_tls
        self.timeout = timeout
        self.poll_attempts = poll_attempts
        self.poll_interval = poll_interval
        self.log_callback = log_callback
        self.headers = {
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "it-IT,it;q=0.9,en;q=0.7",
            "User-Agent": "Mozilla/5.0 NursindCrawler/1.0",
        }

    def log(self, message: str, level: str = "info") -> None:
        if self.log_callback is not None:
            self.log_callback(level, message)

    def _request(self, session, method: str, path: str, **kwargs):
        self.log(f"{method} {path}")
        try:
            response = session.request(
                method,
                f"{self.base_url}{path}",
                timeout=self.timeout,
                verify=self.verify_tls,
                **kwargs,
            )
            response.raise_for_status()
            self.log(f"{method} {path} -> HTTP {response.status_code}")
            return response
        except (requests.Timeout, requests.ConnectionError) as exc:
            self.log(f"{method} {path} -> connection failure", "warning")
            raise TemporaryCrawlerError("Remote service is temporarily unavailable") from exc
        except requests.HTTPError as exc:
            status = exc.response.status_code if exc.response is not None else 0
            self.log(f"{method} {path} -> HTTP {status}", "warning")
            if status >= 500 or status == 429:
                raise TemporaryCrawlerError(
                    f"Remote service returned HTTP {status}"
                ) from exc
            raise InvalidCrawlerResponse(
                f"Remote service returned HTTP {status}"
            ) from exc

    def login(self, username: str, password: str):
        self.log("Opening portal session")
        session = requests.Session()
        session.headers.update(self.headers)
        self._request(session, "GET", "/common/Main.do")
        self._request(session, "GET", "/restrict/index.do?MVTD=Login")
        try:
            self._request(
                session,
                "POST",
                "/restrict/j_security_check",
                data={
                    "j_username": username,
                    "j_password": password,
                    "Login": "  Login  ",
                },
            )
            home = self._request(session, "GET", "/common/Main.do")
            welcome = BeautifulSoup(home.text, "html.parser").select_one(
                ".AFCHeaderWelcome b"
            )
            remote_user = (
                welcome.get_text(strip=True).split()[0] if welcome else None
            )
        except Exception:
            session.close()
            raise
        if remote_user != username:
            session.close()
            self.log("Portal authentication failed", "error")
            raise AuthenticationError("Invalid portal credentials")
        self.log("Portal authentication succeeded")
        return session

    @staticmethod
    def validate_period(year: int, month: int) -> None:
        if month not in range(1, 13):
            raise CrawlerError("Invalid payroll period")

    def download(self, session, year: int, month: int, username: str) -> bytes:
        self.validate_period(year, month)
        month_name = MONTH_NAMES[month - 1]
        self.log(f"Requesting payroll PDF for {year}-{month:02d}")
        self._request(
            session,
            "POST",
            "/ss/CedolinoRichiestaConferma.do?ccsForm=Appoggio:Edit",
            data={
                "anno": year,
                "par": month_name[:3],
                "ci": username,
                "CODICE_MENSILITA": month_name[:3],
                "INVIO_TELEMATICO": "1",
                "E_MAIL": self.email,
                "Button_Update": "Conferma Richiesta",
            },
        )

        for attempt in range(self.poll_attempts):
            self.log(
                f"Checking PDF availability ({attempt + 1}/{self.poll_attempts})"
            )
            listing = self._request(session, "GET", "/ss/CedolinoRichiesta.do?")
            links = BeautifulSoup(listing.text, "html.parser").select("a.AFCLink")
            for link in links:
                title = link.get("title", "")
                words = title.split()
                if month_name in words and str(year) in words:
                    response = self._request(
                        session,
                        "POST",
                        "/ss/UploadDownload",
                        data={
                            "dataSource": "jdbc/gp4web",
                            "functionName": "verify_ci",
                            "p1": "'CEDOLINO_RICHIESTO'",
                            "p2": username,
                        },
                    )
                    content = response.content
                    if not content.startswith(b"%PDF"):
                        self.log("Portal response was not a PDF", "error")
                        raise InvalidCrawlerResponse(
                            "Remote response is not a valid PDF"
                        )
                    self.log(f"Payroll PDF received ({len(content)} bytes)")
                    return content
            if attempt + 1 < self.poll_attempts:
                time.sleep(self.poll_interval)

        self.log("Payroll PDF was not ready before timeout", "warning")
        raise TemporaryCrawlerError("Payroll PDF was not ready before timeout")


def crawler_from_config(config, log_callback=None) -> PayrollCrawler:
    return PayrollCrawler(
        base_url=config["CRAWLER_BASE_URL"],
        email=config["CRAWLER_EMAIL"],
        verify_tls=config["CRAWLER_TLS_VERIFY"],
        timeout=config["CRAWLER_TIMEOUT_SECONDS"],
        poll_attempts=config["CRAWLER_POLL_ATTEMPTS"],
        poll_interval=config["CRAWLER_POLL_INTERVAL_SECONDS"],
        log_callback=log_callback,
    )
