"""Python keywords of the Projects test folder."""
import re

from robot.api.deco import keyword


@keyword("Remove The Tags")
def remove_the_tags(text):
    """Returns a text of _data without its HTML tags, as the page shows it."""
    return re.sub(r"<[^>]+>", "", text)


@keyword("Find A Card With Its Own Page")
def find_a_card_with_its_own_page(cards):
    """Returns the first project card whose Explore button opens a project page of the site, not an external URL or a blog article."""
    return next(card for card in cards if not re.match(r"^(https?:|blog#)", card["explore"]))
