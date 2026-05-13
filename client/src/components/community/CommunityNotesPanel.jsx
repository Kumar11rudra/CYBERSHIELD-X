import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function CommunityNotesPanel({ target, targetType }) {
  const { user } = useAuth();
  const [notes, setNotes] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [votingId, setVotingId] = useState(null);

  useEffect(() => {
    let active = true;

    const loadNotes = async () => {
      if (!target) return;

      setLoading(true);
      try {
        const res = await api.get('/community/notes', {
          params: { target, targetType },
        });
        if (active) setNotes(res.data.notes || []);
      } catch (error) {
        if (active) {
          setNotes([]);
          toast.error(error.response?.data?.error || 'Community notes could not be loaded');
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    loadNotes();
    return () => {
      active = false;
    };
  }, [target, targetType]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!message.trim()) return;

    setSubmitting(true);
    try {
      const res = await api.post('/community/notes', {
        target,
        targetType,
        text: message.trim(),
      });
      setNotes((current) => [res.data.note, ...current]);
      setMessage('');
      toast.success('Community note posted');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Community note could not be posted');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVote = async (noteId) => {
    setVotingId(noteId);
    try {
      const res = await api.post(`/community/notes/${noteId}/vote`);
      setNotes((current) => current.map((note) => (note.id === noteId ? res.data.note : note)));
    } catch (error) {
      toast.error(error.response?.data?.error || 'Vote failed');
    } finally {
      setVotingId(null);
    }
  };

  return (
    <div className="cyber-card p-5 md:p-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-cyber-muted">Community notes</p>
          <h3 className="font-display text-2xl text-cyber-text mt-2">Crowd-sourced context for this indicator</h3>
        </div>
        <div className="rounded-full border border-cyber-border/70 bg-cyber-surface/40 px-3 py-1.5">
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-cyber-accent">
            {notes.length} note{notes.length === 1 ? '' : 's'}
          </span>
        </div>
      </div>

      <p className="font-mono text-xs text-cyber-muted mt-3 leading-relaxed">
        Operators can leave quick context such as false positives, phishing lures, or where this IOC was first observed. Helpful votes surface the strongest note first.
      </p>

      {user ? (
        <form onSubmit={handleSubmit} className="mt-5 space-y-3">
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Add a short note for other operators. Example: observed in credential-phishing email on finance mailbox."
            className="cyber-input min-h-[110px] resize-y"
            maxLength={500}
          />
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-cyber-muted">
              Was this useful? notes below can be upvoted
            </span>
            <button type="submit" disabled={submitting || !message.trim()} className="cyber-button-primary disabled:opacity-40">
              {submitting ? 'Posting...' : 'Post Note'}
            </button>
          </div>
        </form>
      ) : (
        <div className="mt-5 rounded-xl border border-cyber-accent/20 bg-cyber-accent/5 px-4 py-4">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-cyber-accent">Sign in to contribute</p>
          <p className="font-mono text-xs text-cyber-text mt-2">
            You can still read public notes, but posting and helpful voting are available after login.
          </p>
          <Link to="/login" className="inline-flex mt-3 font-mono text-xs uppercase tracking-[0.18em] text-cyber-accent hover:text-cyber-text transition-colors">
            Login to join the signal →
          </Link>
        </div>
      )}

      <div className="mt-6 space-y-3">
        {loading ? (
          <div className="rounded-xl border border-cyber-border/60 bg-cyber-surface/30 px-4 py-8 text-center">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-cyber-muted">Loading community notes...</p>
          </div>
        ) : notes.length > 0 ? (
          notes.map((note) => (
            <div key={note.id} className="rounded-xl border border-cyber-border/60 bg-cyber-surface/35 px-4 py-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <p className="font-display text-base text-cyber-text">{note.username}</p>
                  <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-cyber-muted mt-1">
                    {new Date(note.createdAt).toLocaleString()}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleVote(note.id)}
                  disabled={!user || votingId === note.id}
                  className={`rounded-full border px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.18em] transition-colors ${
                    note.votedByCurrentUser
                      ? 'border-cyber-green/30 bg-cyber-green/10 text-cyber-green'
                      : 'border-cyber-border/70 bg-cyber-surface/30 text-cyber-muted'
                  } ${!user ? 'opacity-50 cursor-not-allowed' : 'hover:text-cyber-text'}`}
                >
                  Useful? {note.helpfulCount}
                </button>
              </div>
              <p className="font-mono text-xs text-cyber-text mt-3 leading-relaxed">{note.text}</p>
            </div>
          ))
        ) : (
          <div className="rounded-xl border border-dashed border-cyber-border/60 px-4 py-8 text-center">
            <p className="font-display text-xl text-cyber-text">No community notes yet</p>
            <p className="font-mono text-xs text-cyber-muted mt-2 max-w-xl mx-auto leading-relaxed">
              This is a good place for first-hand operator knowledge, such as where the IOC appeared, whether it was a false positive, or what control blocked it.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
