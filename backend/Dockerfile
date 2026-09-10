FROM python:3.14-slim

WORKDIR /app

# System deps: PostgreSQL client, GDAL for Django GIS/PostGIS, build toolchain
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev \
    gdal-bin \
    libgdal-dev \
    gcc \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

# Detect GDAL version and set the library path dynamically
RUN ls -la /usr/lib/x86_64-linux-gnu/libgdal* 2>/dev/null || \
    ls -la /usr/lib/libgdal* 2>/dev/null || \
    echo "WARNING: GDAL library not found at expected paths"

COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

COPY . /app/

RUN mkdir -p /app/staticfiles /app/mediafiles

EXPOSE 8000

CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
