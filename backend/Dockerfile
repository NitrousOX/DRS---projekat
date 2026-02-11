FROM python:3.13-slim

# Install basic system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    gnupg2 \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Add Microsoft repository keys and list
RUN curl https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor > /usr/share/keyrings/microsoft-archive-keyring.gpg \
    && echo "deb [arch=amd64,arm64,armhf signed-by=/usr/share/keyrings/microsoft-archive-keyring.gpg] https://packages.microsoft.com/debian/11/prod bullseye main" > /etc/apt/sources.list.d/mssql-release.list

# Install the Microsoft ODBC driver and unixodbc
RUN apt-get update && ACCEPT_EULA=Y apt-get install -y \
    msodbcsql18 \
    unixodbc-dev \
    && rm -rf /var/lib/apt/lists/*

# Install pipenv
RUN pip install --no-cache-dir pipenv

WORKDIR /app

# Copy dependency files
COPY Pipfile Pipfile.lock ./

# Install dependencies system-wide
RUN pipenv install --system --deploy

# Copy all source code
COPY . .
