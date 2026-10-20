"""Python keywords used by at least two test folders."""
import json
from pathlib import Path

from robot.api.deco import keyword

ROOT = Path(__file__).resolve().parents[3]


@keyword("Read The Site Data")
def read_the_site_data(file):
    """Returns the content of a JSON file of the repository, such as _data/projects.json or package.json."""
    return json.loads((ROOT / file).read_text(encoding="utf-8"))

