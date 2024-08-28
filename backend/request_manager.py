import json
from datetime import datetime

class RequestManager:
    def __init__(self, request_file_path, admin_password):
        self.request_file_path = request_file_path
        self.admin_password = admin_password

    def load_requests(self):
        try:
            with open(self.request_file_path, 'r', encoding='utf-8') as file:
                requests = json.load(file)
                for request in requests:
                    if 'comments' in request:
                        for comment in request['comments']:
                            if 'password' in comment:
                                del comment['password']
                return requests
        except FileNotFoundError:
            return []

    def save_requests(self, requests):
        with open(self.request_file_path, 'w', encoding='utf-8') as file:
            json.dump(requests, file, ensure_ascii=False, indent=2)

           
    def get_request(self, request_id, password=None):
        requests = self.load_requests()
        for request in requests:
            if request['id'] == request_id:
                if request['is_public'] or (password and password == request['password']):
                    return request
                else:
                    return {
                        'id': request['id'],
                        'title': request['title'],
                        'is_public': request['is_public'],
                        'created_at': request['created_at'],
                        'status': request['status']
                    }
        return None

    def get_all_requests(self, page=1, per_page=10):
        requests = self.load_requests()
        public_requests = [
            {
                'id': r['id'],
                'title': r['title'],
                'content': r.get('content', '')[:100] + '...' if len(r.get('content', '')) > 100 else r.get('content', ''),
                'created_at': r['created_at'],
                'status': r['status'],
                'is_public': r['is_public']
            } for r in requests
        ]
        sorted_requests = sorted(public_requests, key=lambda x: x['created_at'], reverse=True)
        start = (page - 1) * per_page
        end = start + per_page
        return sorted_requests[start:end], len(sorted_requests)

    def add_request(self, title, content, password, is_public, email):
        requests = self.load_requests()
        new_id = max([r['id'] for r in requests], default=0) + 1
        new_request = {
            'id': new_id,
            'title': title,
            'content': content,
            'password': password,
            'is_public': is_public,
            'email': email,
            'created_at': datetime.now().isoformat(),
            'updated_at': datetime.now().isoformat(),
            'status': '확인 전',
            'comments': []
        }
        requests.append(new_request)
        self.save_requests(requests)
        return new_request


    def update_request(self, request_id, title, content, is_public, email):
        requests = self.load_requests()
        for request in requests:
            if request['id'] == request_id:
                request['title'] = title
                request['content'] = content
                request['is_public'] = is_public
                request['email'] = email
                request['updated_at'] = datetime.now().isoformat()
                self.save_requests(requests)
                return request
        return None

    def delete_request(self, request_id):
        requests = self.load_requests()
        initial_length = len(requests)
        requests = [r for r in requests if r['id'] != request_id]
        if len(requests) < initial_length:
            self.save_requests(requests)
            return True
        return False
    
    def update_request_status(self, request_id, new_status):
        requests = self.load_requests()
        for request in requests:
            if request['id'] == request_id:
                request['status'] = new_status
                request['updated_at'] = datetime.now().isoformat()
                self.save_requests(requests)
                return True
        return False

    def add_comment(self, request_id, content):
        requests = self.load_requests()
        for request in requests:
            if request['id'] == request_id:
                comment = {
                    'id': len(request.get('comments', [])) + 1,
                    'content': content,
                    'created_at': datetime.now().isoformat()
                }
                if 'comments' not in request:
                    request['comments'] = []
                request['comments'].append(comment)
                self.save_requests(requests)
                return comment
        return None

    def delete_comment(self, request_id, comment_id):
        requests = self.load_requests()
        for request in requests:
            if request['id'] == request_id:
                request['comments'] = [c for c in request['comments'] if c['id'] != comment_id]
                self.save_requests(requests)
                return True
        return False

    
    def get_request_comments(self, request_id):
        requests = self.load_requests()
        for request in requests:
            if request['id'] == request_id:
                return request.get('comments', [])
        return None