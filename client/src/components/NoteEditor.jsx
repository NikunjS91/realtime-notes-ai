import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { useNoteSync } from '../hooks/useNoteSync';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5001';

const PLANNED_FEATURES = [
  { icon: '🖼️', label: 'Insert Image', desc: 'Upload photos to your note' },
  { icon: '📊', label: 'Custom Table', desc: 'Create structured tables' },
  { icon: '📎', label: 'Attach File', desc: 'Attach documents & files' },
  { icon: '🎨', label: 'Draw / Sketch', desc: 'Freehand drawing canvas' },
];

const STYLES = [
  { id: 'bullets',   icon: '📋', label: 'Bullet Points' },
  { id: 'paragraph', icon: '📝', label: 'Paragraph' },
  { id: 'poetic',    icon: '🎭', label: 'Poetic' },
  { id: 'oneliner',  icon: '🎯', label: 'One Liner' },
  { id: 'takeaways', icon: '📊', label: 'Key Takeaways' },
  { id: 'eli5',      icon: '🗣️', label: 'ELI5' },
];

const NoteEditor = ({ noteId }) => {
  const { token } = useAuth();
  const { content, title, tags, cursors, updateNote, updateTags, lockTitle } = useNoteSync(noteId, token);

  // Summary state
  const [isSummarising, setIsSummarising] = useState(false);
  const [summary, setSummary] = useState('');
  const [summaryError, setSummaryError] = useState('');
  const [summaryStyle, setSummaryStyle] = useState('bullets');
  const [currentSummaryStyle, setCurrentSummaryStyle] = useState('bullets');
  const [showStylePicker, setShowStylePicker] = useState(false);
  const [usedSummary, setUsedSummary] = useState(false);

  // History state
  const [showHistory, setShowHistory] = useState(false);
  const [versions, setVersions] = useState([]);
  const [restoring, setRestoring] = useState(false);

  // Save state
  const [saveStatus, setSaveStatus] = useState('saved');

  // Tag state
  const [tagInput, setTagInput] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);
  const [suggestedTags, setSuggestedTags] = useState([]);

  // AI auto-title state
  const [autoTitleEnabled, setAutoTitleEnabled] = useState(true);
  const [titleWasManuallySet, setTitleWasManuallySet] = useState(false);
  const [aiTitled, setAiTitled] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);

  // UI state
  const [mounted, setMounted] = useState(false);
  const [showFeatureMenu, setShowFeatureMenu] = useState(false);

  // Refs
  const saveTimer = useRef(null);
  const suggestTimer = useRef(null);
  const tagInputRef = useRef(null);
  const textareaRef = useRef(null);
  const featureMenuRef = useRef(null);
  const lastSuggestedContent = useRef('');

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (showTagInput) tagInputRef.current?.focus();
  }, [showTagInput]);

  useEffect(() => {
    const handler = (e) => {
      if (featureMenuRef.current && !featureMenuRef.current.contains(e.target)) {
        setShowFeatureMenu(false);
      }
      if (!e.target.closest('.style-picker-container')) {
        setShowStylePicker(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // AI suggestion trigger — debounced, fires after 30s of significant change
  const triggerAISuggestion = useCallback((newContent, currentTitle) => {
    if (!newContent || newContent.length < 50) return;
    if (Math.abs(newContent.length - lastSuggestedContent.current.length) < 20) return;

    clearTimeout(suggestTimer.current);
    suggestTimer.current = setTimeout(async () => {
      if (isSuggesting) return;
      setIsSuggesting(true);
      try {
        const res = await axios.post(
          `${API_URL}/api/ai/suggest`,
          { content: newContent, currentTitle },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        lastSuggestedContent.current = newContent;

        // Auto-title logic
        if (autoTitleEnabled && !titleWasManuallySet && res.data.title) {
          const isUntitled = !currentTitle || currentTitle === 'Untitled' || currentTitle === '';
          if (isUntitled) {
            lockTitle(res.data.title);
            setAiTitled(true);
            // Force save AI title to MongoDB immediately
            try {
              await axios.put(
                `${API_URL}/api/notes/${noteId}`,
                { title: res.data.title, content: newContent },
                { headers: { Authorization: `Bearer ${token}` } }
              );
            } catch (e) {
              console.error('Failed to save AI title:', e);
            }
          }
        }

        // Suggested tags — only show ones not already applied
        if (res.data.tags?.length > 0) {
          const currentTags = tags || [];
          const newSuggestions = res.data.tags.filter(t => !currentTags.includes(t));
          setSuggestedTags(newSuggestions);
        }
      } catch (err) {
        // Silent fail — AI suggestions are non-critical
      } finally {
        setIsSuggesting(false);
      }
    }, 8000); // 8 seconds after typing stops
  }, [autoTitleEnabled, titleWasManuallySet, token, tags, isSuggesting]);

  const handleTitleChange = (e) => {
    setSaveStatus('unsaved');
    setTitleWasManuallySet(true);
    setAiTitled(false);
    updateNote(e.target.value, content);
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => setSaveStatus('saved'), 1500);
  };

  const handleContentChange = (e) => {
    setSaveStatus('saving');
    updateNote(title, e.target.value);
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => setSaveStatus('saved'), 1500);
    triggerAISuggestion(e.target.value, title);
  };

  const handleAcceptTag = (tag) => {
    const current = tags || [];
    if (!current.includes(tag) && current.length < 10) {
      updateTags([...current, tag]);
    }
    setSuggestedTags(prev => prev.filter(t => t !== tag));
  };

  const handleDismissTag = (tag) => {
    setSuggestedTags(prev => prev.filter(t => t !== tag));
  };

  const handleSummarise = async () => {
    setIsSummarising(true);
    setSummaryError('');
    setUsedSummary(false);
    try {
      const res = await axios.post(
        `${API_URL}/api/summary/${noteId}`,
        { style: summaryStyle },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSummary(res.data.summary);
      setCurrentSummaryStyle(res.data.style || summaryStyle);
    } catch (err) {
      setSummaryError(err.response?.data?.message || 'Failed to summarise.');
    } finally {
      setIsSummarising(false);
    }
  };

  const handleSummariseWithStyle = async (style) => {
    setSummaryStyle(style);
    setIsSummarising(true);
    setSummaryError('');
    setUsedSummary(false);
    setShowStylePicker(false);
    try {
      const res = await axios.post(
        `${API_URL}/api/summary/${noteId}`,
        { style },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSummary(res.data.summary);
      setCurrentSummaryStyle(res.data.style || style);
    } catch (err) {
      setSummaryError(err.response?.data?.message || 'Failed to summarise.');
    } finally {
      setIsSummarising(false);
    }
  };

  const handleUseSummary = () => {
    const separator = content?.trim() ? '\n\n' : '';
    let insertText = '';
    if (currentSummaryStyle === 'poetic') {
      insertText = summary.split('\n').filter(l => l.trim()).map(l => l.replace(/^[•\-\*]\s*/, '')).join('\n');
    } else if (currentSummaryStyle === 'oneliner') {
      insertText = '"' + summary.replace(/^[•\-\*"]\s*/, '').trim() + '"';
    } else if (currentSummaryStyle === 'paragraph' || currentSummaryStyle === 'eli5') {
      insertText = summary.trim();
    } else if (currentSummaryStyle === 'takeaways') {
      insertText = summary.split('\n').filter(l => l.trim()).map(l => '→ ' + l.replace(/^[→•\-\*]\s*/, '')).join('\n');
    } else {
      insertText = summary.split('\n').filter(l => l.trim()).map(l => '• ' + l.replace(/^[•\-\*]\s*/, '')).join('\n');
    }
    const newContent = (content || '') + separator + insertText;
    updateNote(title, newContent);
    setSaveStatus('saving');
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => setSaveStatus('saved'), 1500);
    setUsedSummary(true);
    setTimeout(() => { if (textareaRef.current) textareaRef.current.scrollTop = textareaRef.current.scrollHeight; }, 100);
  };

  const handleAddTag = (e) => {
    if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim().toLowerCase().replace(/,/g, '');
      if (!tags?.includes(newTag) && tags?.length < 10) updateTags([...(tags || []), newTag]);
      setTagInput('');
    }
    if (e.key === 'Escape') setShowTagInput(false);
  };

  const handleRemoveTag = (tag) => updateTags((tags || []).filter(t => t !== tag));

  const loadVersions = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/notes/${noteId}`, { headers: { Authorization: `Bearer ${token}` } });
      setVersions(res.data.versions || []);
    } catch (err) { console.error(err); }
  };

  const handleShowHistory = () => {
    if (!showHistory) loadVersions();
    setShowHistory(!showHistory);
  };

  const handleRestore = async (versionIndex) => {
    setRestoring(true);
    try {
      await axios.patch(`${API_URL}/api/notes/${noteId}/restore`, { versionIndex }, { headers: { Authorization: `Bearer ${token}` } });
      setShowHistory(false);
    } catch (err) { console.error(err); }
    finally { setRestoring(false); }
  };

  const formatVersionDate = (d) => new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  const SaveIndicator = () => {
    const cfg = {
      saved: { icon: '✓', text: 'Saved', color: '#10b981' },
      saving: { icon: null, text: 'Saving...', color: 'rgba(255,255,255,0.3)' },
      unsaved: { icon: '●', text: 'Unsaved', color: '#f59e0b' }
    }[saveStatus];
    return (
      <div className="flex items-center gap-1.5" style={{ color: cfg.color, fontSize: '12px' }}>
        {saveStatus === 'saving'
          ? <div className="w-3 h-3 rounded-full border border-current border-t-transparent" style={{ animation: 'spin 1s linear infinite' }} />
          : <span>{cfg.icon}</span>}
        <span>{cfg.text}</span>
      </div>
    );
  };

  return (
    <div className="h-full flex overflow-hidden relative"
      style={{ fontFamily: "'DM Sans', sans-serif", opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(8px)', transition: 'all 0.4s cubic-bezier(0.16,1,0.3,1)' }}>

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-6 py-3 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="flex items-center gap-4">
            <SaveIndicator />
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>{content?.length || 0} chars</span>
            {isSuggesting && (
              <div className="flex items-center gap-1.5" style={{ color: 'rgba(139,92,246,0.7)', fontSize: '11px' }}>
                <div className="w-2 h-2 rounded-full border border-current border-t-transparent" style={{ animation: 'spin 1s linear infinite' }} />
                AI analysing...
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* Auto-title toggle */}
            <div className="flex items-center gap-2 px-2 py-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>Auto-title</span>
              <button onClick={() => setAutoTitleEnabled(!autoTitleEnabled)}
                className="relative transition-all duration-200"
                style={{ width: '28px', height: '16px', borderRadius: '8px', background: autoTitleEnabled ? '#10b981' : 'rgba(255,255,255,0.15)', border: 'none', cursor: 'pointer', padding: 0 }}>
                <div style={{
                  position: 'absolute', top: '2px', width: '12px', height: '12px', borderRadius: '50%', background: 'white',
                  left: autoTitleEnabled ? '14px' : '2px', transition: 'left 0.2s cubic-bezier(0.16,1,0.3,1)',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                }} />
              </button>
            </div>

            <button onClick={handleShowHistory}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
              style={{ background: showHistory ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.05)', border: `1px solid ${showHistory ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.08)'}`, color: showHistory ? '#818cf8' : 'rgba(255,255,255,0.5)', transition: 'all 0.15s' }}>
              🕐 History
            </button>

            {/* Style picker + Summarise */}
            <div className="relative flex items-center style-picker-container">
              {showStylePicker && (
                <div className="absolute right-0 top-10 z-50 rounded-xl overflow-hidden"
                  style={{ background: 'rgba(8,16,36,0.95)', border: '1px solid rgba(147,51,234,0.3)', backdropFilter: 'blur(20px)', boxShadow: '0 16px 40px rgba(0,0,0,0.4)', minWidth: '180px' }}>
                  {STYLES.map((s, i) => (
                    <button key={s.id} onClick={() => handleSummariseWithStyle(s.id)}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-left text-sm"
                      style={{ background: summaryStyle === s.id ? 'rgba(147,51,234,0.2)' : 'transparent', color: summaryStyle === s.id ? '#c084fc' : 'rgba(255,255,255,0.7)', borderBottom: i < STYLES.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none', transition: 'background 0.1s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(147,51,234,0.15)'}
                      onMouseLeave={e => e.currentTarget.style.background = summaryStyle === s.id ? 'rgba(147,51,234,0.2)' : 'transparent'}>
                      <span>{s.icon}</span><span>{s.label}</span>
                      {summaryStyle === s.id && <span className="ml-auto text-xs">✓</span>}
                    </button>
                  ))}
                </div>
              )}
              <button onClick={() => !isSummarising && handleSummarise()} disabled={isSummarising}
                className="flex items-center gap-1.5 pl-3 pr-1 py-1.5 rounded-l-lg text-xs font-medium"
                style={{ background: 'linear-gradient(135deg,rgba(147,51,234,0.8),rgba(109,40,217,0.8))', border: '1px solid rgba(147,51,234,0.3)', borderRight: 'none', color: 'white' }}>
                {isSummarising ? <><div className="w-3 h-3 rounded-full border border-white/30 border-t-white" style={{ animation: 'spin 1s linear infinite' }} /> Generating...</> : <><span>✨</span> {STYLES.find(s => s.id === summaryStyle)?.icon} {STYLES.find(s => s.id === summaryStyle)?.label}</>}
              </button>
              <button onClick={() => setShowStylePicker(!showStylePicker)}
                className="flex items-center justify-center px-2 py-1.5 rounded-r-lg text-xs"
                style={{ background: 'rgba(109,40,217,0.8)', border: '1px solid rgba(147,51,234,0.3)', color: 'white', borderLeft: '1px solid rgba(255,255,255,0.15)' }}>▾</button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-8 py-6" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}>

          {/* Title row */}
          <div className="flex items-center gap-2 mb-4">
            <input type="text" value={title} onChange={handleTitleChange}
              placeholder="Note title..."
              className="flex-1 bg-transparent outline-none font-bold"
              style={{ fontSize: '28px', color: 'rgba(255,255,255,0.92)', letterSpacing: '-0.02em', caretColor: '#10b981' }} />
            {aiTitled && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs shrink-0"
                style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.25)', color: 'rgba(196,160,252,0.8)', fontSize: '10px' }}>
                ✨ AI titled
              </span>
            )}
          </div>

          {/* Tags row — manual + suggested */}
          <div className="flex flex-wrap items-center gap-1.5 mb-5">
            {/* Applied tags */}
            {(tags || []).map(tag => (
              <span key={tag} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
                style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: 'rgba(16,185,129,0.8)' }}>
                #{tag}
                <button onClick={() => handleRemoveTag(tag)} style={{ color: 'rgba(16,185,129,0.6)', fontSize: '10px', marginLeft: '2px' }}>✕</button>
              </span>
            ))}

            {/* Suggested tags */}
            {suggestedTags.map(tag => (
              <span key={tag} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
                style={{ background: 'rgba(139,92,246,0.08)', border: '1px dashed rgba(139,92,246,0.35)', color: 'rgba(196,160,252,0.7)', animation: 'slideIn 0.3s ease' }}>
                <span style={{ fontSize: '9px', opacity: 0.7 }}>✨</span>
                #{tag}
                <button onClick={() => handleAcceptTag(tag)}
                  style={{ color: 'rgba(196,160,252,0.8)', fontSize: '10px', marginLeft: '2px', fontWeight: 600 }}
                  title="Accept tag">+</button>
                <button onClick={() => handleDismissTag(tag)}
                  style={{ color: 'rgba(196,160,252,0.4)', fontSize: '10px' }}
                  title="Dismiss">✕</button>
              </span>
            ))}

            {/* Add tag input */}
            {showTagInput ? (
              <input ref={tagInputRef} value={tagInput} onChange={e => setTagInput(e.target.value)}
                onKeyDown={handleAddTag} onBlur={() => { if (!tagInput) setShowTagInput(false); }}
                placeholder="tag name..." className="outline-none bg-transparent text-xs px-2 py-0.5 rounded-full"
                style={{ border: '1px solid rgba(16,185,129,0.3)', color: 'rgba(255,255,255,0.7)', width: '90px', caretColor: '#10b981' }} />
            ) : (tags?.length || 0) < 10 && (
              <button onClick={() => setShowTagInput(true)}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
                style={{ border: '1px dashed rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.25)', transition: 'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(16,185,129,0.3)'; e.currentTarget.style.color = 'rgba(16,185,129,0.6)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = 'rgba(255,255,255,0.25)'; }}>
                + Add tag
              </button>
            )}
          </div>

          <div className="mb-5" style={{ height: '1px', background: 'rgba(255,255,255,0.04)' }} />

          <textarea ref={textareaRef} value={content} onChange={handleContentChange}
            placeholder="Start writing... your thoughts are safe here."
            className="w-full bg-transparent outline-none resize-none"
            style={{ minHeight: '50vh', color: 'rgba(255,255,255,0.75)', fontSize: '15px', lineHeight: '1.8', caretColor: '#10b981' }} />

          {/* AI Summary panel */}
          {summary && (
            <div className="mt-8 rounded-xl overflow-hidden"
              style={{ background: 'rgba(147,51,234,0.06)', border: '1px solid rgba(147,51,234,0.2)', animation: 'slideIn 0.4s cubic-bezier(0.16,1,0.3,1)' }}>
              <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid rgba(147,51,234,0.15)' }}>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background: 'rgba(147,51,234,0.3)', fontSize: '12px' }}>✨</div>
                  <span className="text-xs font-semibold" style={{ color: '#c084fc' }}>AI Summary</span>
                  <span className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>via Llama 4 Maverick</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => navigator.clipboard.writeText(summary)}
                    className="px-2.5 py-1 rounded-lg text-xs"
                    style={{ background: 'rgba(147,51,234,0.15)', border: '1px solid rgba(147,51,234,0.2)', color: 'rgba(192,132,252,0.8)', transition: 'all 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(147,51,234,0.25)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(147,51,234,0.15)'}>Copy</button>
                  <button onClick={handleUseSummary} disabled={usedSummary}
                    className="px-2.5 py-1 rounded-lg text-xs font-medium"
                    style={{ background: usedSummary ? 'rgba(16,185,129,0.08)' : 'linear-gradient(135deg,rgba(16,185,129,0.85),rgba(5,150,105,0.85))', border: `1px solid ${usedSummary ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.4)'}`, color: usedSummary ? 'rgba(16,185,129,0.4)' : 'white', cursor: usedSummary ? 'default' : 'pointer', transition: 'all 0.2s' }}>
                    {usedSummary ? '✓ Added to note' : '↓ Use This'}
                  </button>
                  <button onClick={() => { setSummary(''); setUsedSummary(false); }} style={{ color: 'rgba(255,255,255,0.2)', fontSize: '12px' }}>✕</button>
                </div>
              </div>
              <div className="px-4 py-4">
                {currentSummaryStyle === 'bullets' && (
                  <div className="space-y-2.5">
                    {summary.split('\n').filter(l => l.trim()).map((line, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <div className="w-1 h-1 rounded-full mt-2 shrink-0" style={{ background: '#c084fc' }} />
                        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.65)', lineHeight: '1.6' }}>{line.replace(/^[•\-\*]\s*/, '')}</p>
                      </div>
                    ))}
                  </div>
                )}
                {currentSummaryStyle === 'poetic' && (
                  <div style={{ borderLeft: '2px solid rgba(192,132,252,0.3)', paddingLeft: '16px' }}>
                    {summary.split('\n').filter(l => l.trim()).map((line, i) => (
                      <p key={i} className="text-sm" style={{ color: 'rgba(255,255,255,0.75)', lineHeight: '2', fontStyle: 'italic' }}>{line.replace(/^[•\-\*]\s*/, '')}</p>
                    ))}
                  </div>
                )}
                {currentSummaryStyle === 'oneliner' && (
                  <p style={{ color: 'rgba(255,255,255,0.85)', lineHeight: '1.8', borderLeft: '3px solid #c084fc', paddingLeft: '16px', fontStyle: 'italic', fontSize: '16px' }}>
                    "{summary.replace(/^[•\-\*"]\s*/, '')}"
                  </p>
                )}
                {currentSummaryStyle === 'paragraph' && (
                  <p className="text-sm" style={{ color: 'rgba(255,255,255,0.7)', lineHeight: '1.9' }}>{summary}</p>
                )}
                {currentSummaryStyle === 'takeaways' && (
                  <div className="space-y-3">
                    {summary.split('\n').filter(l => l.trim()).map((line, i, arr) => (
                      <div key={i} className="flex items-start gap-2" style={{ paddingBottom: '8px', borderBottom: i < arr.length - 1 ? '1px solid rgba(192,132,252,0.1)' : 'none' }}>
                        <span style={{ color: '#c084fc', fontSize: '14px', marginTop: '1px' }}>→</span>
                        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.7)', lineHeight: '1.6' }}>{line.replace(/^[→•\-\*]\s*/, '')}</p>
                      </div>
                    ))}
                  </div>
                )}
                {currentSummaryStyle === 'eli5' && (
                  <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <p className="text-sm" style={{ color: 'rgba(255,255,255,0.75)', lineHeight: '1.9' }}>🧒 {summary}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {summaryError && (
            <div className="mt-4 px-4 py-3 rounded-xl flex items-center gap-2"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <span style={{ color: '#ef4444' }}>⚠</span>
              <p className="text-xs" style={{ color: 'rgba(239,68,68,0.8)' }}>{summaryError}</p>
              <button onClick={() => setSummaryError('')} className="ml-auto" style={{ color: 'rgba(239,68,68,0.4)', fontSize: '12px' }}>✕</button>
            </div>
          )}
          <div className="h-24" />
        </div>
      </div>

      {/* Version history panel */}
      <div className="shrink-0 overflow-hidden" style={{ width: showHistory ? '280px' : '0px', borderLeft: showHistory ? '1px solid rgba(255,255,255,0.06)' : 'none', background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(16px)', transition: 'width 0.3s cubic-bezier(0.16,1,0.3,1)' }}>
        {showHistory && (
          <div className="h-full flex flex-col" style={{ width: '280px' }}>
            <div className="px-4 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div>
                <p className="font-semibold text-sm" style={{ color: 'rgba(255,255,255,0.8)' }}>Version History</p>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>{versions.length} saved</p>
              </div>
              <button onClick={() => setShowHistory(false)} className="w-6 h-6 flex items-center justify-center rounded-lg text-xs" style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)' }}>✕</button>
            </div>
            <div className="flex-1 overflow-y-auto py-3 px-3 space-y-2" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}>
              {versions.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-center">
                  <span className="text-2xl mb-2">📭</span>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>No versions yet</p>
                </div>
              ) : [...versions].reverse().map((v, i) => (
                <div key={i} className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#10b981' }} />
                      <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>v{versions.length - i}</span>
                    </div>
                    <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '10px' }}>{formatVersionDate(v.savedAt)}</span>
                  </div>
                  <p className="text-xs mb-2.5" style={{ color: 'rgba(255,255,255,0.35)', lineHeight: '1.5', fontSize: '11px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {v.content?.slice(0, 80) || 'Empty'}…
                  </p>
                  <button onClick={() => handleRestore(versions.length - 1 - i)} disabled={restoring}
                    className="w-full py-1.5 rounded-lg text-xs font-medium"
                    style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#10b981', transition: 'all 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(16,185,129,0.2)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(16,185,129,0.1)'}>
                    {restoring ? 'Restoring...' : 'Restore'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Floating + feature menu */}
      <div ref={featureMenuRef} style={{ position: 'fixed', bottom: '24px', right: '24px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '12px', zIndex: 50 }}>
        {showFeatureMenu && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end', animation: 'slideUp 0.3s cubic-bezier(0.16,1,0.3,1)' }}>
            {PLANNED_FEATURES.map((f, i) => (
              <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 16px', borderRadius: '16px', background: 'rgba(8,16,36,0.9)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)', cursor: 'not-allowed' }}>
                <span style={{ fontSize: '18px' }}>{f.icon}</span>
                <div>
                  <p style={{ fontSize: '13px', fontWeight: 500, color: 'rgba(255,255,255,0.7)' }}>{f.label}</p>
                  <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>{f.desc}</p>
                </div>
                <span style={{ padding: '2px 8px', borderRadius: '6px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#10b981', fontSize: '9px', fontWeight: 600, marginLeft: '4px' }}>SOON</span>
              </div>
            ))}
          </div>
        )}
        <button onClick={() => setShowFeatureMenu(!showFeatureMenu)}
          style={{ width: '48px', height: '48px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.12)', background: showFeatureMenu ? 'rgba(255,255,255,0.08)' : 'linear-gradient(135deg,#10b981,#059669)', boxShadow: showFeatureMenu ? '0 4px 16px rgba(0,0,0,0.3)' : '0 8px 24px rgba(16,185,129,0.35)', color: 'white', fontSize: '22px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: showFeatureMenu ? 'rotate(45deg)' : 'rotate(0deg)', transition: 'all 0.3s cubic-bezier(0.16,1,0.3,1)' }}>+</button>
      </div>

      {/* Collaborator cursors */}
      {Object.keys(cursors || {}).length > 0 && (
        <div style={{ position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '8px' }}>
          {Object.entries(cursors).map(([uid, data]) => (
            <div key={uid} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', borderRadius: '100px', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', backdropFilter: 'blur(8px)' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', animation: 'pulse 2s ease-in-out infinite' }} />
              <span style={{ fontSize: '12px', fontWeight: 500, color: '#10b981' }}>{data.userName}</span>
            </div>
          ))}
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        textarea::placeholder, input::placeholder { color: rgba(255,255,255,0.18); }
      `}</style>
    </div>
  );
};

export default NoteEditor;
