FROM python:3.11-slim-bullseye
RUN apt update
RUN apt upgrade -y
RUN apt install -y build-essential libpq-dev
WORKDIR /app
COPY . .
RUN pip install -r requirements.txt
CMD ["python", "main_dev.py"]