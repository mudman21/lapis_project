import os
import logging
import time
import secrets
from flask import Flask, jsonify, request, send_file, after_this_request, send_from_directory, session, abort
from flask_cors import CORS
from werkzeug.utils import secure_filename
from functools import wraps
from dotenv import load_dotenv
from datetime import timedelta 
from data_manager import DataManager
from audio_manager import AudioManager
from image_manager import ImageManager
from news_manager import NewsManager
from request_manager import RequestManager
from update_manager import UpdateManager
from collections import Counter

# .env 파일 로드
load_dotenv()

app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY')
CORS(app, resources={r"/*": {"origins": ["http://localhost:3000", "http://43.203.225.17:3000", "http://ec2-43-203-225-17.ap-northeast-2.compute.amazonaws.com", "http://ec2-43-203-225-17.ap-northeast-2.compute.amazonaws.com:3000"]}})


# 설정
ADMIN_USERNAME = os.getenv('ADMIN_USERNAME')
ADMIN_PASSWORD = os.getenv('ADMIN_PASSWORD')
app.config['UPLOAD_FOLDER'] = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB 제한
app.config['SESSION_COOKIE_SECURE'] = False  # 개발 환경에서는 False로 설정
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=1)
app.config['SESSION_TYPE'] = 'filesystem'

# 로깅 설정
logging.basicConfig(level=logging.DEBUG)

# 업로드 폴더 생성
if not os.path.exists(app.config['UPLOAD_FOLDER']):
    os.makedirs(app.config['UPLOAD_FOLDER'])

# 경로 설정
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
metadata_path = os.path.join(project_root, 'data', 'Lapis_meta.xlsx')

# 매니저 초기화
image_manager = ImageManager(os.path.join(project_root, "data", "library_music", "artwork"))
audio_manager = AudioManager(os.path.join(project_root, "data", "library_music", "mp3"))
data_manager = DataManager(metadata_path, image_manager)
news_manager = NewsManager(os.path.join(project_root, "data", "news.json"))
request_manager = RequestManager(os.path.join(project_root, "data", "requests.json"), ADMIN_PASSWORD)
update_manager = UpdateManager(os.path.join(project_root, "data"), metadata_path)

# 전역 변수
library_stats = data_manager.get_library_stats()
valid_tokens = {}

# 유틸리티 함수
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user' not in session:
            print("Unauthorized access attempt")  # 디버그 로그 추가
            return jsonify({"error": "Unauthorized"}), 401
        return f(*args, **kwargs)
    return decorated_function

def allowed_file(filename):
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# 라우트

@app.before_request
def before_request():
    session.permanent = True
    print("Before request. Session:", session)  # 디버그 로그 추가

@app.after_request
def after_request(response):
    print("After request. Session:", session)  # 디버그 로그 추가
    return response

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user' not in session:
            print("Unauthorized access attempt. Session:", session)  # 디버그 로그 추가
            return jsonify({"error": "Unauthorized"}), 401
        return f(*args, **kwargs)
    return decorated_function

@app.route('/')
def hello():
    return "Welcome to Lapis Music Library API!"

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    app.logger.info(f"Login attempt: username={data.get('username')}")
    if data['username'] == ADMIN_USERNAME and data['password'] == ADMIN_PASSWORD:
        session['user'] = ADMIN_USERNAME
        session.permanent = True  # 세션을 영구적으로 설정
        app.logger.info("Login successful")
        return jsonify({"message": "Login successful", "user": ADMIN_USERNAME}), 200
    app.logger.warning("Login failed")
    return jsonify({"error": "Invalid credentials"}), 401

@app.route('/api/logout', methods=['POST'])
def logout():
    session.pop('user', None)
    app.logger.info("User logged out")
    return jsonify({"message": "Logout successful"}), 200



@app.route('/get_audio_token/<album_code>/<track_number>/<song_name>/<version>')
def get_audio_token(album_code, track_number, song_name, version):
    if album_code == 'undefined':
        return jsonify({'error': 'Invalid album code'}), 400
    token = secrets.token_urlsafe()
    valid_tokens[token] = {
        'album_code': album_code,
        'track_number': track_number,
        'song_name': song_name,
        'version': version,
        'expires': time.time() + 300  # 5분 유효
    }
    return jsonify({'token': token})

@app.route('/audio/<token>')
def get_audio(token):
    if token not in valid_tokens:
        abort(403, description="Invalid token")
    
    token_data = valid_tokens[token]
    if time.time() > token_data['expires']:
        del valid_tokens[token]
        abort(403, description="Expired token")
    
    allowed_referers = ['http:://localhost:3000', 'http:://ec2-43-203-225-17.ap-northeast-2.compute.amazonaws.com:3000']
    referer = request.headers.get('Referer')
    if not referer or not any(referer.startswith(allowed) for allowed in allowed_referers):
        abort(403, description="Invalid referer")
    
    file_path = audio_manager.get_audio_file_path(
        token_data['album_code'],
        token_data['track_number'],
        token_data['song_name'],
        token_data['version']
    )
    if not file_path:
        abort(404, description="Audio file not found")
    
    @after_this_request
    def add_header(response):
        filename = secure_filename(f"{token_data['song_name']}_{token_data['version']}.mp3")
        response.headers['Content-Disposition'] = f'attachment; filename="{filename}"'
        response.headers['Content-Type'] = 'audio/mpeg'
        return response
    
    return send_file(file_path, as_attachment=True)

@app.route('/api/albums/<album_code>')
def get_album_details(album_code):
    album = data_manager.get_album_details(album_code)
    if album:
        return jsonify(album)
    return jsonify({"error": "Album not found"}), 404

@app.route('/api/albums')
def get_albums():
    limit = request.args.get('limit', default=None, type=int)
    albums = data_manager.get_albums(limit=limit)
    return jsonify(albums)

@app.route('/api/news', methods=['GET'])
def get_all_news():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    news, total = news_manager.get_all_news(page, per_page)
    return jsonify({
        'news': news,
        'total': total,
        'page': page,
        'per_page': per_page,
        'total_pages': (total - 1) // per_page + 1
    })

@app.route('/api/news/<int:news_id>', methods=['GET'])
def get_news(news_id):
    news = news_manager.get_news(news_id)
    if news:
        return jsonify(news)
    return jsonify({"error": "News not found"}), 404

@app.route('/api/news', methods=['POST'])
def create_news():
    app.logger.info("Received news creation request")
    if 'user' not in session:
        app.logger.warning("Unauthorized news creation attempt")
        return jsonify({"error": "Unauthorized"}), 401
    
    data = request.json
    app.logger.info(f"Received news data: {data}")
    try:
        # 중복 체크 로직
        existing_news = news_manager.get_news_by_title(data['title'])
        if existing_news:
            app.logger.warning(f"Attempted to create duplicate news: {data['title']}")
            return jsonify({"error": "News with this title already exists"}), 400

        news = news_manager.add_news(data['title'], data['content'], data.get('image_url'))
        app.logger.info(f"News created successfully: {news}")
        return jsonify(news), 201
    except Exception as e:
        app.logger.error(f"Error creating news: {str(e)}")
        return jsonify({"error": str(e)}), 400

@app.route('/api/news/<int:news_id>', methods=['PUT'])
@login_required
def update_news(news_id):
    data = request.json
    news = news_manager.update_news(news_id, data['title'], data['content'], data.get('image_url'))
    if news:
        return jsonify(news)
    return jsonify({"error": "News not found"}), 404

@app.route('/api/news/<int:news_id>', methods=['DELETE'])
@login_required
def delete_news(news_id):
    if news_manager.delete_news(news_id):
        return '', 204
    return jsonify({"error": "News not found"}), 404

@app.route('/api/upload-news-image', methods=['POST'])
@login_required
def upload_news_image():
    if 'image' not in request.files:
        return jsonify({"error": "No image file"}), 400
    
    file = request.files['image']
    
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(file_path)
        file_url = f"{request.host_url}uploads/{filename}"
        return jsonify({"imageUrl": file_url}), 200
    
    return jsonify({"error": "File type not allowed"}), 400

@app.route('/api/requests', methods=['GET'])
def get_all_requests():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    requests, total = request_manager.get_all_requests(page, per_page)
    return jsonify({
        'requests': requests,
        'total': total,
        'page': page,
        'per_page': per_page,
        'total_pages': (total - 1) // per_page + 1
    })

@app.route('/api/requests/<int:request_id>/check-password', methods=['POST'])
def check_request_password(request_id):
    data = request.json
    print(f"Checking password for request {request_id}: {data['password']}")  # 로그 추가
    request_item = request_manager.get_request(request_id, data['password'])
    print(f"Request item: {request_item}")  # 로그 추가
    if request_item and 'content' in request_item:
        return jsonify({"message": "Password correct", "request": request_item}), 200
    return jsonify({"error": "Incorrect password"}), 403

@app.route('/api/requests/<int:request_id>', methods=['GET'])
def get_request_details(request_id):
    password = request.args.get('password')
    include_private = 'user' in session  # 로그인한 사용자인 경우 비공개 정보 포함
    request_data = request_manager.get_request(request_id, password)
    
    if request_data:
        if request_data.get('is_public') or include_private or (password and password == request_data.get('password')):
            return jsonify(request_data)
        else:
            return jsonify({"error": "Password required", "is_public": False}), 403
    return jsonify({"error": "Request not found"}), 404


@app.route('/api/requests/<int:request_id>', methods=['GET', 'POST'])
def handle_request(request_id):
    is_admin = 'user' in session and session['user'] == ADMIN_USERNAME
    if request.method == 'GET':
        request_data = request_manager.get_request(request_id)
        if request_data:
            if request_data['is_public'] or is_admin:
                return jsonify(request_data)
            else:
                return jsonify({"error": "Password required", "is_public": False}), 403
        return jsonify({"error": "Request not found"}), 404
    
    elif request.method == 'POST':
        password = request.json.get('password')
        request_data = request_manager.get_request(request_id, password)
        if request_data and 'content' in request_data:
            return jsonify(request_data)
        else:
            return jsonify({"error": "Incorrect password"}), 403

@app.route('/api/requests', methods=['POST'])
def add_request():
    data = request.json
    new_request = request_manager.add_request(
        data['title'], 
        data['content'], 
        data['password'], 
        data.get('is_public', True), 
        data.get('email', '')
    )
    return jsonify(new_request), 201

@app.route('/api/requests/<int:request_id>', methods=['PUT'])
def update_request(request_id):
    data = request.json
    updated_request = request_manager.update_request(
        request_id, 
        data['title'], 
        data['content'], 
        data.get('is_public', True), 
        data.get('email', '')
    )
    
    if updated_request:
        return jsonify(updated_request)
    else:
        return jsonify({"error": "Request not found"}), 404


@app.route('/api/requests/<int:request_id>', methods=['DELETE'])
def delete_request(request_id):
    try:
        if request_manager.delete_request(request_id):
            return jsonify({"message": "Request deleted successfully"}), 200
        else:
            return jsonify({"error": "Request not found"}), 404
    except Exception as e:
        app.logger.error(f"Error deleting request: {str(e)}")
        return jsonify({"error": "An error occurred while deleting the request"}), 500

@app.route('/api/requests/<int:request_id>/status', methods=['PUT'])
@login_required
def update_request_status(request_id):
    data = request.json
    new_status = data.get('status')
    if request_manager.update_request_status(request_id, new_status):
        return jsonify({"message": "Status updated successfully"}), 200
    return jsonify({"error": "Request not found"}), 404


@app.route('/api/requests/<int:request_id>/comments', methods=['GET'])
def get_request_comments(request_id):
    comments = request_manager.get_request_comments(request_id)
    if comments is not None:
        return jsonify(comments)
    return jsonify({"error": "Request not found"}), 404

@app.route('/api/requests/<int:request_id>/comments', methods=['POST'])
@login_required
def add_comment(request_id):
    data = request.json
    content = data.get('content')
    comment = request_manager.add_comment(request_id, content)
    if comment:
        return jsonify(comment), 201
    return jsonify({"error": "Request not found"}), 404

@app.route('/api/requests/<int:request_id>/comments/<int:comment_id>', methods=['DELETE'])
@login_required
def delete_comment(request_id, comment_id):
    if request_manager.delete_comment(request_id, comment_id):
        return '', 204
    return jsonify({"error": "Comment not found or you don't have permission to delete it"}), 404


@app.route('/api/requests/<int:request_id>/like', methods=['POST'])
def like_request(request_id):
    likes = request_manager.like_request(request_id)
    if likes is not None:
        return jsonify({"likes": likes})
    return jsonify({"error": "Request not found"}), 404

@app.route('/api/requests/<int:request_id>/dislike', methods=['POST'])
def dislike_request(request_id):
    dislikes = request_manager.dislike_request(request_id)
    if dislikes is not None:
        return jsonify({"dislikes": dislikes})
    return jsonify({"error": "Request not found"}), 404

@app.route('/api/update', methods=['POST'])
def update_database():
    data = request.json
    if data.get('admin_password') == ADMIN_PASSWORD:
        result = update_manager.update_database()
        return jsonify(result)
    return jsonify({"error": "Unauthorized"}), 401

@app.route('/api/check-updates', methods=['GET'])
def check_for_updates():
    try:
        updates_available = update_manager.check_for_updates()
        return jsonify({"updates_available": updates_available})
    except NotImplementedError:
        return jsonify({"error": "This feature is not implemented yet"}), 501
    





@app.route('/api/library_stats')
def get_library_stats():
    return jsonify(library_stats)



@app.route('/api/upload-image', methods=['POST'])
def upload_image():
    if 'image' not in request.files:
        return jsonify({"error": "No image file"}), 400
    
    file = request.files['image']
    
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(file_path)
        
        # 파일 URL 생성 (전체 URL 반환)
        file_url = f"{request.host_url}uploads/{filename}"
        
        return jsonify({"imageUrl": file_url}), 200
    
    return jsonify({"error": "File type not allowed"}), 400

def allowed_file(filename):
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# 정적 파일 서빙을 위한 라우트
@app.route('/uploads/<path:filename>')
def serve_image(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)




@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)


@app.route('/api/news/<int:news_id>/comments', methods=['GET', 'POST'])
def news_comments(news_id):
    if request.method == 'GET':
        news = news_manager.get_news(news_id)
        if news:
            return jsonify(news.get('comments', []))
        return jsonify({"error": "News not found"}), 404
    elif request.method == 'POST':
        data = request.json
        comment = news_manager.add_comment(news_id, data['content'])
        if comment:
            return jsonify(comment), 201
        return jsonify({"error": "Failed to add comment"}), 400
    
@app.route('/data/<path:filename>')
def serve_data(filename):
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    return send_from_directory(os.path.join(root_dir, 'data'), filename)

@app.route('/artwork/<album_code>')
def get_artwork(album_code):
    try:
        return image_manager.get_album_artwork(album_code)
    except FileNotFoundError:
        return jsonify({"error": "Artwork not found"}), 404

@app.route('/api/check_auth', methods=['GET'])
def check_auth():
    app.logger.info(f"Checking auth status. Session: {session}")
    if 'user' in session:
        return jsonify({"authenticated": True, "user": session['user']}), 200
    return jsonify({"authenticated": False}), 401


@app.route('/api/search', methods=['GET'])
def search():
    query = request.args.get('q', '').lower()
    track_page = int(request.args.get('track_page', 1))
    album_page = int(request.args.get('album_page', 1))
    if not query:
        return jsonify({'tracks': [], 'albums': [], 'total_tracks': 0, 'total_albums': 0})

    main_tracks = []
    albums = []
    sub_tracks = {}
    track_codes = set()

    print(f"Searching for query: {query}")  # 디버깅 메시지

    for _, track in data_manager.data.iterrows():
        track_dict = track.to_dict()
        album_code = track_dict['ALBUM: Code']
        track_number = track_dict['TRACK: Number']
        
        # 앨범 검색 (기존 코드와 동일)
        album_tags = data_manager.album_tags[album_code]
        album_match = (
            query in track_dict['ALBUM: Title'].lower() or
            query in track_dict.get('ALBUM: Introduction', '').lower() or
            any(query in tag.lower() for tag in album_tags['ALBUM: Description']) or
            any(query in tag.lower() for tag in album_tags['TRACK: Genre'])
        )
        
        if album_match and album_code not in [a['ALBUM: Code'] for a in albums]:
            albums.append({
                'ALBUM: Code': album_code,
                'ALBUM: Title': track_dict['ALBUM: Title'],
                'ALBUM: Description': ', '.join(album_tags['ALBUM: Description']),
                'TRACK: Genre': ', '.join(album_tags['TRACK: Genre']),
                'ALBUM: Introduction': track_dict.get('ALBUM: Introduction', ''),
                'has_artwork': data_manager.image_manager.artwork_exists(album_code)
            })

        # 트랙 검색
        track_code = f"{album_code}-{int(float(track_number))}"  # 소수점 이하를 무시
        if any(query in str(value).lower() for value in track_dict.values()):
            if track_dict['TRACK: Is Main'] == 'Y':
                print(f"Found main track: {track_dict['TRACK: Title']} (Number: {track_number})")  # 디버깅 메시지
                main_track = {
                    'ALBUM: Code': album_code,
                    'TRACK: Number': track_number,
                    'TRACK: Title': track_dict['TRACK: Title'],
                    'TRACK: Version': track_dict['TRACK: Version'],
                    'TRACK: Composer(s)': track_dict['TRACK: Composer(s)'],
                    'TRACK: Genre': track_dict['TRACK: Genre'],
                    'TRACK: Mood': track_dict['TRACK: Mood'],
                    'TRACK: Keywords': track_dict['TRACK: Keywords'],
                    'sub_tracks': []
                }
                main_tracks.append(main_track)
                sub_tracks[track_code] = main_track['sub_tracks']
                track_codes.add(track_code)
            elif track_dict['TRACK: Is Main'] == 'N':
                main_track_number = track_dict['TRACK: Main Track Number']
                if main_track_number:
                    main_track_code = f"{album_code}-{int(float(main_track_number))}"  # 소수점 이하를 무시
                    print(f"Found sub track: {track_dict['TRACK: Title']} (Number: {track_number}) for main track {main_track_code}")  # 디버깅 메시지
                    if main_track_code in sub_tracks:
                        sub_tracks[main_track_code].append({
                            'TRACK: Number': track_number,
                            'TRACK: Title': track_dict['TRACK: Title'],
                            'TRACK: Version': track_dict['TRACK: Version']
                        })
                    else:
                        print(f"Warning: Main track {main_track_code} not found for sub track {track_dict['TRACK: Title']}")

    # 서브 트랙 연결 확인
    for main_track in main_tracks:
        main_track_code = f"{main_track['ALBUM: Code']}-{int(float(main_track['TRACK: Number']))}"  # 소수점 이하를 무시
        if main_track['sub_tracks']:
            print(f"Main track: {main_track['TRACK: Title']} (Number: {main_track['TRACK: Number']}), Sub tracks: {len(main_track['sub_tracks'])}")
        else:
            print(f"Main track: {main_track['TRACK: Title']} (Number: {main_track['TRACK: Number']}), No sub tracks")

    # 반환 직전에 추가
    print(f"Total tracks with sub tracks: {sum(1 for track in main_tracks if track['sub_tracks'])}")

    # 페이지네이션 적용
    tracks_start = (track_page - 1) * 10
    tracks_end = tracks_start + 10
    albums_start = (album_page - 1) * 5
    albums_end = albums_start + 5

    return jsonify({
        'tracks': main_tracks[tracks_start:tracks_end],
        'albums': albums[albums_start:albums_end],
        'total_tracks': len(main_tracks),
        'total_albums': len(albums)
    })

@app.route('/api/all_tags', methods=['GET'])
def get_all_tags():
    return jsonify(data_manager.get_all_tags())

@app.route('/api/albums/adjacent/<album_code>')
def get_adjacent_albums(album_code):
    prev_code, next_code = data_manager.get_adjacent_album_codes(album_code)
    return jsonify({'prevAlbumCode': prev_code, 'nextAlbumCode': next_code})

# Add this method to your DataManager class if not already present
def get_all_album_codes(self):
    return sorted(self.data['ALBUM: Code'].unique().tolist())

@app.route('/api/reload_data', methods=['POST'])
@login_required
def reload_data():
    try:
        # 메타데이터 및 앨범 태그 다시 로드
        data_manager.load_metadata()
        data_manager.precompute_album_tags()

        # 뉴스 및 요청 정보 다시 로드
        news_manager.load_news()
        request_manager.load_requests()

        # 이미지 매니저 재초기화 (아트워크 정보 다시 로드)
        global image_manager
        image_manager = ImageManager(os.path.join(project_root, "data", "library_music", "artwork"))

        # 오디오 매니저 재초기화 (오디오 파일 정보 다시 로드)
        global audio_manager
        audio_manager = AudioManager(os.path.join(project_root, "data", "library_music", "mp3"))

        # 데이터 매니저에 새로운 이미지 매니저 설정
        data_manager.set_image_manager(image_manager)

        # 모든 앨범 코드 가져오기
        album_codes = data_manager.get_all_album_codes()

        # 각 앨범의 상세 정보 다시 로드
        for album_code in album_codes:
            data_manager.get_album_details(album_code)

        return jsonify({"message": "All data reloaded successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)