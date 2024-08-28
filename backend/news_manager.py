import json
from datetime import datetime
import os

class NewsManager:
    def __init__(self, news_file_path):
        self.news_file_path = news_file_path

    def load_news(self):
        if os.path.exists(self.news_file_path):
            with open(self.news_file_path, 'r', encoding='utf-8') as file:
                return json.load(file)
        return []

    def save_news(self, news):
        with open(self.news_file_path, 'w', encoding='utf-8') as file:
            json.dump(news, file, ensure_ascii=False, indent=2)

    def get_all_news(self, page=1, per_page=10):
        news = self.load_news()
        # 최신순으로 정렬 (created_at 필드를 기준으로)
        news.sort(key=lambda x: x['created_at'], reverse=True)
        total = len(news)
        start = (page - 1) * per_page
        end = start + per_page
        return news[start:end], total
    
    def get_news(self, news_id):
        news = self.load_news()
        for item in news:
            if item['id'] == news_id:
                return item
        return None

    def add_news(self, title, content, image_url=None):
        news = self.load_news()
        new_id = max([item['id'] for item in news], default=0) + 1
        current_time = datetime.now().isoformat()
        new_news = {
            'id': new_id,
            'title': title,
            'content': content,
            'image_url': image_url,
            'created_at': current_time,
            'updated_at': current_time
        }
        news.append(new_news)
        self.save_news(news)
        return new_news

    def update_news(self, news_id, title, content, image_url=None):
        news = self.load_news()
        for item in news:
            if item['id'] == news_id:
                item['title'] = title
                item['content'] = content
                if image_url is not None:
                    item['image_url'] = image_url
                item['updated_at'] = datetime.now().isoformat()
                self.save_news(news)
                return item
        return None

    def delete_news(self, news_id):
        news = self.load_news()
        news = [item for item in news if item['id'] != news_id]
        self.save_news(news)
        return True

    def get_news_by_title(self, title):
        news = self.load_news()
        return next((item for item in news if item['title'] == title), None)

    def add_comment(self, news_id, content):
        news = self.load_news()
        for item in news:
            if item['id'] == news_id:
                if 'comments' not in item:
                    item['comments'] = []
                comment = {
                    'id': len(item['comments']) + 1,
                    'content': content,
                    'created_at': datetime.now().isoformat()
                }
                item['comments'].append(comment)
                self.save_news(news)
                return comment
        return None

    def get_comments(self, news_id):
        news = self.load_news()
        for item in news:
            if item['id'] == news_id:
                return item.get('comments', [])
        return []