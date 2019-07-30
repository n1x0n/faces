FROM python:3-alpine
LABEL maintainer="Fredrik Nygren <fredrik@phight.club>"

RUN apk add --no-cache wget

COPY requirements.txt requirements.txt
RUN pip install -r requirements.txt && rm requirements.txt

# Copy the entire app
COPY /app .
WORKDIR /app

EXPOSE 5000
ENTRYPOINT ["python", "run.py"]