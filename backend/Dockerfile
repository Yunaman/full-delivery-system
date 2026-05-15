# Stage 1: Build stage
FROM python:3.12-slim-bookworm AS builder

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=off \
    PIP_DISABLE_PIP_VERSION_CHECK=on

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY requirements.txt .
RUN pip install --upgrade pip && \
    pip install --prefix=/install -r requirements.txt


# Stage 2: Production stage
FROM python:3.12-slim-bookworm

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Install runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    curl \
    netcat-openbsd \
    && rm -rf /var/lib/apt/lists/*

# Copy installed python packages from builder
COPY --from=builder /install /usr/local

# Copy project files
COPY . .

# Create logs directory and non-privileged user
RUN mkdir -p /app/logs /app/staticfiles /app/media && \
    useradd -m django && \
    chown -R django:django /app && \
    chmod +x /app/docker-entrypoint.sh

USER django

ENTRYPOINT ["/app/docker-entrypoint.sh"]

# Healthcheck - using a versioned endpoint that exists
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/api/auth/login/ || exit 1

EXPOSE 8000

CMD ["daphne", "-b", "0.0.0.0", "-p", "8000", "delivery_platform.asgi:application"]
