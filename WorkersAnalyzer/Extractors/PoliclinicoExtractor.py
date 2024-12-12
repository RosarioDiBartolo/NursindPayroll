import datetime
import re
from typing import Generator, List, Tuple

from .PageExtractor import PageExtractor, RowExtract


class PoliclinicoExtractor(PageExtractor):
    # Regex patterns
    PATTERN_DATA = re.compile(r'(lu|ma|me|gi|ve|sa|do)(\s|\*)(\d\d)')
    PATTERN_TIMBRATURE = re.compile(r"(E|U|u|e)(\d\d\d\d)")
    PATTERN_ORARI_LAVORATIVI = re.compile(r"(\d\d\.\d\d)")
    PATTERN_NAME = re.compile(r"BADGE:\d+(.*)")


    def extract_name(self) -> str:
        """Extract the name associated with the badge."""
        match = PoliclinicoExtractor.PATTERN_NAME.search(self.page[2])
        if not match:
            raise ValueError("Name not found in the content.")
        return match.group(1).strip()

    def _get_content(self) -> Generator[str, None, None]:
        """
        Yield non-numeric rows of the page content, starting from the 8th row.
        Rows containing '*' are replaced with spaces.
        """
        for row in self.page[7:]:
            try:
                float(row)  # Skip rows that can be converted to float
            except ValueError:
                yield row.replace("*", " ")


    def _extract_row (self ,row: str ) -> List[tuple[str, datetime, datetime.timedelta]] :
        """
        Extract timbrature, orari lavorativi, and date information from a row.
        Returns a list of tuples containing:
        - Type of timbrature ('E' or 'U')
        - Date and time as a datetime object
        - Working hours as a timedelta
        """
        timbrature = PoliclinicoExtractor.PATTERN_TIMBRATURE.findall(row)
        orari_lavorativi = PoliclinicoExtractor.PATTERN_ORARI_LAVORATIVI.findall(row)[:len(timbrature)]

        date_match = PoliclinicoExtractor.PATTERN_DATA.search(row)
        if not date_match or not timbrature:
            return []

        # Extract weekday and day
        wday, day = date_match.group().replace("*", " ").split()
        day = int(day)

        try:
            return [
                 RowExtract(
                        extractor= self,
                        tipo = tipo.upper(),
                        giorno=day,
                        ora = int(orario[0:2]),
                        minuto= int(orario[2:]),

                        ora_orario_lavorativo =  orario_lavorativo[0:2],
                        minuto_orario_lavorativo=orario_lavorativo[3:]
                )
                for (tipo, orario), orario_lavorativo in zip(timbrature, orari_lavorativi)
            ]
        except Exception as e:
            raise ValueError(f"Error processing row: {row}. Details: {e}") from e
