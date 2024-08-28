FROM python:3.8

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV FLASK_ENV=production
ENV FLASK_APP=app.py

CMD ["gunicorn", "-b", "0.0.0.0:5000", "app:app"]