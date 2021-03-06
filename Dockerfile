FROM python:3-alpine
LABEL maintainer="Fredrik Nygren <fredrik@phight.club>"

RUN apk add --no-cache wget
RUN apk add --no-cache bash

COPY requirements.txt requirements.txt
RUN pip install -r requirements.txt && rm requirements.txt

# Copy the entire app
RUN mkdir /app
COPY /app /app
WORKDIR /app

EXPOSE 5000
ENTRYPOINT ["./start.sh"]
