import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/NewsItem.css';
import { API_BASE_URL } from '../constants';

function NewsItem({ item }) {
  const MAX_EXCERPT_LENGTH = 100; // 미리보기 최대 길이 (원하는 값으로 조절)

  const excerpt = item.content.split(/\n/).reduce((acc, line) => {
    if (acc.length + line.length + 1 <= MAX_EXCERPT_LENGTH) {
      return acc + line + '\n'; // 누적 길이가 최대 길이를 넘지 않으면 줄 추가
    } else {
      return acc; // 최대 길이를 넘으면 더 이상 추가하지 않음
    }
  }, '');

  return (
    <Link to={`/news/${item.id}`} className="news-item">
      {item.image_url && (
        <div className="news-item-image-container">
          <div 
            className="news-item-image" 
            style={{ backgroundImage: `url(${item.image_url.startsWith('http') ? item.image_url : `${API_BASE_URL}${item.image_url}`})` }}
          />
        </div>
      )}
      <div className="news-item-content">
        <h2 className="news-item-title">{item.title}</h2>
        <p className="news-item-date">{new Date(item.created_at).toLocaleDateString()}</p>
        <p className="news-item-excerpt">
          {excerpt.split(/\n/).map((line, index) => (
            <React.Fragment key={index}>
              {line}
              <br />
            </React.Fragment>
          ))}
          {excerpt.length < item.content.length && '...'} {/* 생략 부호 추가 */}
        </p>
        <span className="news-item-readmore">Read More</span>
      </div>
    </Link>
  );
}

export default NewsItem;

