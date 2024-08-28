import React, { useRef, useEffect, useState, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import '../styles/CustomEditor.css';


const CustomEditor = ({ initialContent, onChange }) => {
  const editorRef = useRef(null);
  const [isComposing, setIsComposing] = useState(false);
  const fileInputRef = useRef(null);

  const setCursorToEnd = useCallback(() => {
    const range = document.createRange();
    const sel = window.getSelection();
    if (editorRef.current) {
      range.selectNodeContents(editorRef.current);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
    }
  }, []);

  useEffect(() => {
    if (editorRef.current && initialContent) {
      editorRef.current.innerHTML = initialContent;
      setCursorToEnd();
    }
  }, [initialContent, setCursorToEnd]);

  const handleInput = () => {
    if (!isComposing && onChange && editorRef.current) {
      const content = editorRef.current.innerHTML;
      onChange(content);
    }
  };

  const handleCompositionStart = () => {
    setIsComposing(true);
  };

  const handleCompositionEnd = () => {
    setIsComposing(false);
    handleInput();
    setCursorToEnd();
  };

  const execCommand = (command, value = null) => {
    document.execCommand(command, false, value);
    handleInput();
    setCursorToEnd();
  };

  const handleKeyUp = () => {
    handleInput();
    setCursorToEnd();
  };

  const handleBold = () => execCommand('bold');
  const handleItalic = () => execCommand('italic');
  const handleUnderline = () => execCommand('underline');
  const handleAlignment = (align) => execCommand('justify' + align);
  const handleFontSize = (e) => execCommand('fontSize', e.target.value);
  const handleFontFamily = (e) => execCommand('fontName', e.target.value);
  const handleColor = (e) => execCommand('foreColor', e.target.value);

  const handleLink = () => {
    const url = prompt('Enter the URL:');
    if (url) {
      execCommand('createLink', url);
    }
  };

  const handleImageUpload = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const formData = new FormData();
        formData.append('image', file);   


        const response = await fetch('http://ec2-43-203-225-17.ap-northeast-2.compute.amazonaws.com:5000/api/upload-image', {
          method: 'POST',
          body: formData,
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error('Image upload failed');
        }

        const data = await response.json();
        const imageUrl = data.imageUrl;

        execCommand('insertImage', imageUrl);
      } catch (error) {
        console.error('Error uploading image:', error);
        alert('Failed to upload image. Please try again.');
      }
    }
  };

  return (
    <div className="custom-editor" onKeyUp={handleKeyUp}>
      <div className="toolbar">
        <button type="button" onClick={handleBold}><FontAwesomeIcon icon="bold" /></button>
        <button type="button" onClick={handleItalic}><FontAwesomeIcon icon="italic" /></button>
        <button type="button" onClick={handleUnderline}><FontAwesomeIcon icon="underline" /></button>
        <button type="button" onClick={() => handleAlignment('Left')}><FontAwesomeIcon icon="align-left" /></button>
        <button type="button" onClick={() => handleAlignment('Center')}><FontAwesomeIcon icon="align-center" /></button>
        <button type="button" onClick={() => handleAlignment('Right')}><FontAwesomeIcon icon="align-right" /></button>
        <select onChange={handleFontSize}>
          <option value="1">Small</option>
          <option value="3">Normal</option>
          <option value="5">Large</option>
          <option value="7">Extra Large</option>
        </select>
        <select onChange={handleFontFamily}>
          <option value="Arial">Arial</option>
          <option value="Helvetica">Helvetica</option>
          <option value="Times New Roman">Times New Roman</option>
          <option value="Courier">Courier</option>
        </select>   

        <input type="color" onChange={handleColor} />
        <button type="button" onClick={handleLink}><FontAwesomeIcon icon="link" /></button>
        <button type="button" onClick={handleImageUpload}><FontAwesomeIcon icon="image" /></button>
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleFileChange}
          accept="image/*"
        />
      </div>
      <div
        ref={editorRef}
        className="editor-content"
        contentEditable
        onCompositionStart={handleCompositionStart}
        onCompositionEnd={handleCompositionEnd}
        dangerouslySetInnerHTML={{ __html: initialContent }}
      />
    </div>
  );
};

export default CustomEditor;