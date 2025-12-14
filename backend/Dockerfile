FROM python:3.8-slim

WORKDIR /project

COPY ./requirements.txt .
RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

COPY project /project
COPY ./script.sh /script.sh
RUN chmod +x /script.sh

ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

EXPOSE 8000

CMD ["bash", "/script.sh"]