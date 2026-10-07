# ==============================================================================
# AYIS Backend Dockerfile — High-performance .NET 8 Minimal API + Dapper
# ==============================================================================
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy project definition and restore NuGet dependencies
COPY backend/Ayis.Api/Ayis.Api.csproj ./backend/Ayis.Api/
RUN dotnet restore backend/Ayis.Api/Ayis.Api.csproj

# Copy the entire backend codebase and build release binary
COPY backend/Ayis.Api/ ./backend/Ayis.Api/
WORKDIR /src/backend/Ayis.Api
RUN dotnet publish -c Release -o /app/publish /p:UseAppHost=false

# ==============================================================================
# Runtime image — Minimal ASP.NET Core Linux Container
# ==============================================================================
FROM mcr.microsoft.com/dotnet/aspnet:8.0-alpine AS runtime
WORKDIR /app

# Non-root user security best practice
RUN addgroup -S ayisgroup && adduser -S ayisuser -G ayisgroup

COPY --from=build /app/publish .

# Environment variables
ENV ASPNETCORE_URLS=http://+:5050 \
    ASPNETCORE_ENVIRONMENT=Production \
    DOTNET_SYSTEM_GLOBALIZATION_INVARIANT=1

EXPOSE 5050

USER ayisuser

ENTRYPOINT ["dotnet", "Ayis.Api.dll"]
