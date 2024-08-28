import React, { useState, useEffect } from 'react';
import '../styles/RequestForm.css';

function RequestForm({ onSubmit, initialData, onCancel }) {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    email: '',
    password: '',
    is_public: true
  });


  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : 
               name === 'is_public' ? value === 'true' : 
               value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form className="request-form" onSubmit={handleSubmit}>
      <input
        type="text"
        name="title"
        value={formData.title}
        onChange={handleChange}
        placeholder="Title"
        required
      />
      <textarea
        name="content"
        value={formData.content}
        onChange={handleChange}
        placeholder="Content"
        required
      />
      <input
        type="email"
        name="email"
        value={formData.email}
        onChange={handleChange}
        placeholder="Email"
      />
      {!initialData && (
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="Password"
          required
        />
      )}
      <div className="visibility-options">
        <label>
          <input
            type="radio"
            name="is_public"
            value="true"
            checked={formData.is_public === true}
            onChange={handleChange}
          />
          Public
        </label>
        <label>
          <input
            type="radio"
            name="is_public"
            value="false"
            checked={formData.is_public === false}
            onChange={handleChange}
          />
          Private
        </label>
      </div>
      <button type="submit">{initialData ? 'Update' : 'Submit'}</button>
      {onCancel && <button type="button" onClick={onCancel}>Cancel</button>}
    </form>
  );
}

export default RequestForm;