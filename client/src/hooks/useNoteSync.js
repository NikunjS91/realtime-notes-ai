import { useState, useEffect, useCallback, useRef } from 'react';
import { useSocket } from './useSocket';

export const useNoteSync = (noteId, token) => {
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [cursors, setCursors] = useState({});
  const [summary, setSummary] = useState('');
  const [tags, setTags] = useState([]);
  const { socket } = useSocket(token);
  const debounceRef = useRef(null);
  const aiTitleSetRef = useRef(false);

  // Reset all state when switching notes
  useEffect(() => {
    setTitle('');
    setContent('');
    setSummary('');
    setTags([]);
    setCursors({});
    aiTitleSetRef.current = false;
  }, [noteId]);

  useEffect(() => {
    if (!socket || !noteId) return;

    socket.emit('join-note', { noteId });

    socket.on('note-data', (data) => {
      if (!aiTitleSetRef.current) {
        setTitle(data.title);
      }
      setContent(data.content);
      setSummary(data.summary || '');
      setTags(data.tags || []);
    });

    socket.on('tags-updated', (data) => {
      setTags(data.tags);
    });

    socket.on('note-updated', (data) => {
      setTitle(data.title);
      setContent(data.content);
    });

    socket.on('cursor-updated', (data) => {
      setCursors((prev) => ({
        ...prev,
        [data.userId]: {
          userName: data.userName,
          position: data.position
        }
      }));
    });

    return () => {
      socket.emit('leave-note', { noteId });
      socket.off('note-data');
      socket.off('note-updated');
      socket.off('cursor-updated');
      socket.off('tags-updated');
    };
  }, [socket, noteId]);

  const updateNote = useCallback((newTitle, newContent) => {
    setTitle(newTitle);
    setContent(newContent);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      if (socket && noteId) {
        socket.emit('note-update', {
          noteId,
          title: newTitle,
          content: newContent
        });
      }
    }, 300);
  }, [socket, noteId]);

  const lockTitle = useCallback((newTitle) => {
    aiTitleSetRef.current = true;
    setTitle(newTitle);
  }, []);

  const updateCursor = useCallback((position) => {
    if (socket && noteId) {
      socket.emit('cursor-move', {
        noteId,
        userId: socket.id,
        userName: 'User',
        position
      });
    }
  }, [socket, noteId]);

  const updateTags = useCallback((newTags) => {
    setTags(newTags);
    if (socket && noteId) {
      socket.emit('tags-update', { noteId, tags: newTags });
    }
  }, [socket, noteId]);

  return {
    content,
    title,
    summary,
    tags,
    cursors,
    updateNote,
    updateCursor,
    updateTags,
    lockTitle
  };
};