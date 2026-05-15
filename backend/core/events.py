import logging

logger = logging.getLogger(__name__)

def publish_event(name: str, payload: dict):
    """Lightweight event publisher used by domain services (placeholder).

    In production this should push to Kafka/Kinesis or another durable event bus.
    """
    logger.info("EVENT %s %s", name, payload)
