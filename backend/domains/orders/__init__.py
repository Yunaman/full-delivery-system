"""Orders domain package (DDD bounded context).

This package exposes the orders domain modules. Avoid importing modules
that touch Django ORM at package import time to keep import-time side
effects minimal (helps test collection and static analysis).
"""

__all__ = ["models", "services", "repositories", "serializers"]
