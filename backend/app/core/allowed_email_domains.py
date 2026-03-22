"""Allowlist of public email domains permitted for self-service signup."""

ALLOWED_SIGNUP_EMAIL_DOMAINS: frozenset[str] = frozenset(
    {
        "gmail.com",
        "googlemail.com",
        "outlook.com",
        "hotmail.com",
        "live.com",
        "msn.com",
        "yahoo.com",
        "yahoo.co.uk",
        "yahoo.co.in",
        "ymail.com",
        "rocketmail.com",
        "icloud.com",
        "me.com",
        "mac.com",
        "aol.com",
        "protonmail.com",
        "proton.me",
        "zoho.com",
        "gmx.com",
        "gmx.net",
        "mail.com",
        "yandex.com",
        "hey.com",
        "fastmail.com",
    },
)


def signup_email_domain_allowed(normalized_email: str) -> bool:
    """True if the domain part of a normalized (lowercased) email is in the allowlist."""
    if "@" not in normalized_email:
        return False
    domain = normalized_email.rsplit("@", 1)[-1]
    return domain in ALLOWED_SIGNUP_EMAIL_DOMAINS
