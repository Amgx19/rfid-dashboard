// src/components/AuthorizedCards/AuthorizedCards.js
import React, { useState } from "react";
import "./AuthorizedCards.css";

function AuthorizedCards({ 
  cards, 
  newCard, 
  newCardName, 
  showSuccess,
  onCardChange,
  onNameChange,
  onAdd,
  onRemove 
}) {
  const [errors, setErrors] = useState({ uid: '', name: '' });

  // التحقق من صحة UID
  const validateUID = (uid) => {
    const uidPattern = /^[0-9A-Fa-f]{2}-[0-9A-Fa-f]{2}-[0-9A-Fa-f]{2}-[0-9A-Fa-f]{2}$/;
    if (!uid) {
      return 'الرجاء إدخال UID';
    }
    if (!uidPattern.test(uid)) {
      return 'تنسيق خاطئ! يجب أن يكون بصيغة: XX-XX-XX-XX';
    }
    return '';
  };

  // التحقق من صحة الاسم
  const validateName = (name) => {
    const namePattern = /^[\u0600-\u06FFa-zA-Z\s]{3,}$/;
    if (!name) {
      return 'الرجاء إدخال الاسم';
    }
    if (name.length < 3) {
      return 'الاسم يجب أن يكون 3 أحرف على الأقل';
    }
    if (!namePattern.test(name)) {
      return 'الاسم يجب أن يحتوي على أحرف عربية أو إنجليزية فقط';
    }
    return '';
  };

  // معالجة تغيير UID
  const handleUIDChange = (value) => {
    // السماح فقط بالأرقام والحروف A-F والشرطة
    let formatted = value.toUpperCase().replace(/[^0-9A-F-]/g, '');
    
    // إزالة الشرطات الزائدة
    formatted = formatted.replace(/-+/g, '-');
    
    // تنسيق تلقائي XX-XX-XX-XX
    if (formatted.length > 11) {
      formatted = formatted.substring(0, 11);
    }
    
    onCardChange(formatted);
    
    // إزالة رسالة الخطأ عند الكتابة
    if (errors.uid) {
      setErrors(prev => ({ ...prev, uid: '' }));
    }
  };

  // معالجة تغيير الاسم
  const handleNameChange = (value) => {
    onNameChange(value);
    
    // إزالة رسالة الخطأ عند الكتابة
    if (errors.name) {
      setErrors(prev => ({ ...prev, name: '' }));
    }
  };

  // معالجة الإضافة مع التحقق
  const handleAddWithValidation = () => {
    const uidError = validateUID(newCard);
    const nameError = validateName(newCardName);
    
    if (uidError || nameError) {
      setErrors({ uid: uidError, name: nameError });
      return;
    }
    
    // التحقق من عدم تكرار البطاقة
    const uidUpper = newCard.toUpperCase();
    if (cards.find(c => c.uid === uidUpper)) {
      setErrors({ uid: 'هذه البطاقة موجودة مسبقاً!', name: '' });
      return;
    }
    
    setErrors({ uid: '', name: '' });
    onAdd();
  };

  return (
    <div className="card panel-card">
      <div className="panel-header">
        <div className="icon-badge bg-purple">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="5" width="20" height="14" rx="2" />
            <line x1="2" y1="10" x2="22" y2="10" />
          </svg>
        </div>
        <h3>البطاقات المصرح بها</h3>
      </div>

      <div className="add-card-form">
        <div className="input-group">
          <input
            type="text"
            placeholder="اسم صاحب البطاقة (3 أحرف على الأقل)"
            value={newCardName}
            onChange={(e) => handleNameChange(e.target.value)}
            className={`card-input ${errors.name ? 'error' : ''}`}
          />
          {errors.name && <span className="error-message">{errors.name}</span>}
        </div>
        
        <div className="input-group">
          <input
            type="text"
            placeholder="UID (مثال: 89-27-34-03)"
            value={newCard}
            onChange={(e) => handleUIDChange(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddWithValidation()}
            className={`card-input ${errors.uid ? 'error' : ''}`}
            maxLength="11"
          />
          {errors.uid && <span className="error-message">{errors.uid}</span>}
        </div>
        
        <button className="btn btn-primary" onClick={handleAddWithValidation}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          إضافة
        </button>
      </div>

      {showSuccess && (
        <div className="success-message">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
          تمت الإضافة بنجاح!
        </div>
      )}

      <div className="cards-list">
        {cards.length === 0 ? (
          <p className="empty-state">لا توجد بطاقات مصرح بها</p>
        ) : (
          cards.map((c) => (
            <div key={c.uid} className="card-item">
              <div className="card-info">
                <span className="card-name-text">{c.name || "بدون اسم"}</span>
                <span className="card-uid-text">{c.uid}</span>
              </div>
              <button className="btn-icon btn-delete" onClick={() => onRemove(c.uid)} title="حذف البطاقة">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default AuthorizedCards;