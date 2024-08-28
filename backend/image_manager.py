import os
from flask import send_file, abort

class ImageManager:
    def __init__(self, base_directory):
        self.base_directory = base_directory

    def get_album_artwork(self, album_code):
        file_name = f"{album_code}.jpg"
        file_path = os.path.join(self.base_directory, file_name)
        if os.path.exists(file_path):
            return send_file(file_path, mimetype='image/jpeg')
        else:
            abort(404, description="Artwork not found")

    def artwork_exists(self, album_code):
        file_name = f"{album_code}.jpg"
        file_path = os.path.join(self.base_directory, file_name)
        return os.path.exists(file_path)