import pandas as pd
import os
from collections import Counter

class DataManager:
    def __init__(self, metadata_path, image_manager=None):
        self.metadata_path = metadata_path
        self.data = None
        self.image_manager = image_manager
        self.album_tags = {}  # 앨범별 태그를 저장할 딕셔너리
        self.album_codes = []        
        self.load_metadata()
        self.precompute_album_tags()

    def load_metadata(self):
        if os.path.exists(self.metadata_path):
            self.data = pd.read_excel(self.metadata_path, sheet_name='Lapis')
            required_columns = [
                'ALBUM: Code', 'ALBUM: Title', 'ALBUM: Description', 
                'ALBUM: Keywords', 'ALBUM: Introduction', 'ALBUM: Release Date',
                'TRACK: Number', 'TRACK: Title', 'TRACK: Is Main', 
                'TRACK: Version', 'TRACK: Composer(s)', 'TRACK: Genre',
                'TRACK: Keywords', 'TRACK: Mood', 'TRACK: Main Track Number'
            ]
            for column in required_columns:
                if column not in self.data.columns:
                    print(f"Warning: Column '{column}' not found in the metadata file.")
            print("Metadata loaded successfully")
        else:
            print(f"Metadata file not found at {self.metadata_path}")

    def precompute_album_tags(self):
        for album_code, album_data in self.data.groupby('ALBUM: Code'):
            main_tracks = album_data[album_data['TRACK: Is Main'] == 'Y']
            description_tags = []
            genre_tags = []
            
            for _, track in main_tracks.iterrows():
                description_tags.extend(track['ALBUM: Description'].split(','))
                genre_tags.extend(track['TRACK: Genre'].split(','))
            
            description_counter = Counter(description_tags)
            genre_counter = Counter(genre_tags)
            
            self.album_tags[album_code] = {
                'ALBUM: Description': [tag.strip() for tag, count in description_counter.items() if count >= 5],
                'TRACK: Genre': [tag.strip() for tag, count in genre_counter.items() if count >= 5]
            }
            self.album_codes = sorted([code for code in self.data['ALBUM: Code'].unique() if code.startswith('LP')])
        print("Album tags pre-computed successfully")
    def get_albums(self, limit=None):
        if self.data is None:
            self.load_metadata()
        
        albums = self.data.groupby('ALBUM: Code').agg({
            'ALBUM: Title': 'first',
            'ALBUM: Description': lambda x: ', '.join(self.album_tags[x.name]['ALBUM: Description']),
            'TRACK: Genre': lambda x: ', '.join(self.album_tags[x.name]['TRACK: Genre']),
        }).reset_index()
        
        albums = albums.sort_values('ALBUM: Code', ascending=False)
        
        if limit:
            albums = albums.head(limit)
        
        result = albums.to_dict('records')
        
        for album in result:
            if self.image_manager:
                album['has_artwork'] = self.image_manager.artwork_exists(album['ALBUM: Code'])
            else:
                album['has_artwork'] = None
        
        return result

    def get_album_details(self, album_code):
        if self.data is None:
            self.load_metadata()
        
        album = self.data[self.data['ALBUM: Code'] == album_code]
        
        if album.empty:
            return None
        
        album_info = {
            'ALBUM: Code': album['ALBUM: Code'].iloc[0],
            'ALBUM: Title': album['ALBUM: Title'].iloc[0],
            'ALBUM: Description': album['ALBUM: Description'].iloc[0],
            'ALBUM: Keywords': ', '.join(sorted(set(album['ALBUM: Keywords'].dropna().str.split(',').sum()))),
            'TRACK: Genre': ', '.join(sorted(set(album['TRACK: Genre'].str.split(',').sum()))),
            'ALBUM: Introduction': album['ALBUM: Introduction'].iloc[0],
            'ALBUM: Release Date': album['ALBUM: Release Date'].iloc[0].strftime('%Y-%m-%d'),
            'tracks': []
        }

        for _, track in album.iterrows():
            track_info = {
                'TRACK: Number': track['TRACK: Number'],
                'TRACK: Title': track['TRACK: Title'],
                'TRACK: Is Main': track['TRACK: Is Main'],
                'TRACK: Version': track['TRACK: Version'],
                'TRACK: Composer(s)': track['TRACK: Composer(s)'],
                'TRACK: Genre': ', '.join(sorted(set(str(track['TRACK: Genre']).split(',')))),
                'TRACK: Keywords': ', '.join(sorted(set(str(track['TRACK: Keywords']).split(',')))),
                'TRACK: Mood': ', '.join(sorted(set(str(track['TRACK: Mood']).split(',')))),
                'TRACK: Main Track Number': track['TRACK: Main Track Number'] if pd.notna(track['TRACK: Main Track Number']) else track['TRACK: Number']
            }
            album_info['tracks'].append(track_info)
        
        if self.image_manager:
            album_info['has_artwork'] = self.image_manager.artwork_exists(album_code)
        else:
            album_info['has_artwork'] = None
        
        return album_info

    def get_library_stats(self):
        if self.data is None:
            self.load_metadata()
        
        total_albums = int(self.data['ALBUM: Code'].nunique())
        main_tracks = int(self.data['TRACK: Is Main'].eq('Y').sum())
        total_tracks = int(len(self.data))
        
        return {
            'total_albums': total_albums,
            'main_tracks': main_tracks,
            'total_tracks': total_tracks
        }
    def get_all_tags(self):
        all_description_tags = set()
        all_genre_tags = set()
        
        for tags in self.album_tags.values():
            all_description_tags.update(tags['ALBUM: Description'])
            all_genre_tags.update(tags['TRACK: Genre'])
        
        return {
            'description': sorted(list(all_description_tags)),
            'genre': sorted(list(all_genre_tags))
        }
    def get_adjacent_album_codes(self, current_code):
        if current_code not in self.album_codes:
            return None, None

        current_index = self.album_codes.index(current_code)
        prev_code = self.album_codes[current_index - 1] if current_index > 0 else None
        next_code = self.album_codes[current_index + 1] if current_index < len(self.album_codes) - 1 else None

        return prev_code, next_code    