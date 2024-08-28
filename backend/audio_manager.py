import os
from flask import send_file, abort, jsonify
from mutagen import File as MutagenFile
from pydub import AudioSegment
import re

class AudioManager:
    def __init__(self, base_directory):
        self.base_directory = base_directory

    def get_album_path(self, album_code):
        for folder in os.listdir(self.base_directory):
            if folder.startswith(album_code + '_'):
                return os.path.join(self.base_directory, folder)
        return None
  
    def get_audio_file_path(self, album_code, track_number, song_name, version):
        album_path = self.get_album_path(album_code)
        if not album_path:
            print(f"Album path not found for album code: {album_code}")
            return None

        print(f"Searching for file: album_code={album_code}, track_number={track_number}, song_name={song_name}, version={version}")

        # track_number를 문자열로 처리
        track_number_str = str(track_number)

        # 소수점 이하를 제거하고 3자리 정수로 포맷팅
        track_number_int = int(float(track_number_str))
        file_prefix = f"{album_code}_{track_number_int:03d}_"

        print(f"Formatted track number: {track_number_int:03d}")
        print(f"Searching for files with prefix: {file_prefix}")

        for file in os.listdir(album_path):
            print(f"Checking file: {file}")
            if file.lower().startswith(file_prefix.lower()):
                # 파일 이름에서 트랙 번호와 앨범 코드를 제거
                remaining_name = file[len(file_prefix):].lower()
                # 확장자 제거
                remaining_name = os.path.splitext(remaining_name)[0]
                
                # 파일 이름에서 특수 문자를 제거하고 비교
                safe_song_name = re.sub(r'[^\w\s]', '', song_name.lower())
                safe_remaining_name = re.sub(r'[^\w\s]', '', remaining_name)
                
                print(f"File prefix matched. Checking song name and version...")
                print(f"Safe song name: {safe_song_name}")
                print(f"Safe remaining name: {safe_remaining_name}")
                print(f"Version: {version.lower()}")

                if safe_song_name in safe_remaining_name and version.lower() in remaining_name:
                    full_path = os.path.join(album_path, file)
                    print(f"Found matching file: {full_path}")
                    return full_path
                else:
                    print(f"Song name or version didn't match for file: {file}")

        print(f"No matching file found for: {song_name} - {version}")
        return None

    def get_audio_file(self, album_code, track_number, song_name, version):
        file_path = self.get_audio_file_path(album_code, track_number, song_name, version)
        return send_file(file_path, mimetype='audio/mpeg')

    def get_audio_metadata(self, album_code, track_number, song_name, version):
        album_path = self.get_album_path(album_code)
        if not album_path:
            abort(404, description="Album not found")

        filename = f"{album_code}_{track_number:03d}_{song_name}_{version}.mp3"
        file_path = os.path.join(album_path, filename)

        if os.path.exists(file_path):
            audio = MutagenFile(file_path)
            metadata = {
                "album_code": album_code,
                "track_number": track_number,
                "song_name": song_name,
                "version": version,
                "title": audio.get("title", [song_name])[0],
                "artist": audio.get("artist", ["Unknown"])[0],
                "album": audio.get("album", [os.path.basename(album_path).split('_', 1)[1]])[0],
                "duration": audio.info.length
            }
            return metadata
        else:
            abort(404, description="Audio file not found")

    def get_album_tracks(self, album_code):
        album_path = self.get_album_path(album_code)
        if not album_path:
            abort(404, description="Album not found")

        tracks = []
        for filename in os.listdir(album_path):
            if filename.endswith('.mp3') and not filename.startswith('preview_'):
                parts = filename.split('_')
                if len(parts) == 4:
                    tracks.append({
                        "track_number": int(parts[1]),
                        "song_name": parts[2],
                        "version": parts[3].split('.')[0]
                    })
        return sorted(tracks, key=lambda x: x['track_number'])