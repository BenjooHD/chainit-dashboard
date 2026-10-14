'use client';

import { useState } from 'react';
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';

interface Idea {
  id: string;
  title: string;
  description: string;
  category: string;
  author: string;
  votes: number;
  createdAt: string;
}

export default function BrainstormingView() {
  const [ideas, setIdeas] = useState<Idea[]>([
    {
      id: '1',
      title: 'Implement real-time collaboration',
      description: 'Add live updates when multiple team members are working on tasks',
      category: 'Features',
      author: 'Noah',
      votes: 3,
      createdAt: new Date().toISOString(),
    },
    {
      id: '2',
      title: 'Add custom status workflows',
      description: 'Allow teams to define their own task status pipelines',
      category: 'Features',
      author: 'Ben',
      votes: 2,
      createdAt: new Date().toISOString(),
    },
  ]);

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Features',
    author: 'Noah',
  });

  const [filterCategory, setFilterCategory] = useState('all');

  const categories = ['Features', 'Improvements', 'Business', 'Marketing'];

  const filteredIdeas = filterCategory === 'all'
    ? ideas
    : ideas.filter(idea => idea.category === filterCategory);

  const sortedIdeas = [...filteredIdeas].sort((a, b) => b.votes - a.votes);

  const handleAddIdea = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    const newIdea: Idea = {
      id: Date.now().toString(),
      ...formData,
      votes: 0,
      createdAt: new Date().toISOString(),
    };

    setIdeas([...ideas, newIdea]);
    setFormData({ title: '', description: '', category: 'Features', author: 'Noah' });
    setShowForm(false);
  };

  const handleVote = (id: string) => {
    setIdeas(ideas.map(idea =>
      idea.id === id ? { ...idea, votes: idea.votes + 1 } : idea
    ));
  };

  const handleDeleteIdea = (id: string) => {
    setIdeas(ideas.filter(idea => idea.id !== id));
  };

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Brainstorming</h2>
        <Button onClick={() => setShowForm(true)}>+ Idea</Button>
      </div>

      <div className="filter-pills">
        {['all', ...categories].map(cat => (
          <button
            key={cat}
            className={`quick-nav-item ${filterCategory === cat ? 'quick-nav-item-active' : ''}`}
            onClick={() => setFilterCategory(cat)}
          >
            {cat === 'all' ? 'All' : cat}
          </button>
        ))}
      </div>

      <div className="idea-list">
        {sortedIdeas.length === 0 ? (
          <div className="empty-state">No ideas yet. Start brainstorming!</div>
        ) : (
          sortedIdeas.map(idea => (
            <div key={idea.id} className="idea-card">
              <div>
                <div className="idea-title">{idea.title}</div>
                {idea.description && <div className="idea-desc">{idea.description}</div>}
                <div className="idea-meta">
                  <span className="pill">{idea.category}</span>
                  <span>by {idea.author}</span>
                  <span>{new Date(idea.createdAt).toLocaleDateString('de-DE')}</span>
                </div>
              </div>
              <div className="idea-side">
                <button className="vote-btn" onClick={() => handleVote(idea.id)}>
                  <span className="vote-count">{idea.votes}</span>
                  votes
                </button>
                <button className="icon-btn icon-btn-danger" onClick={() => handleDeleteIdea(idea.id)}>
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {showForm && (
        <Modal
          title="New Idea"
          onClose={() => setShowForm(false)}
          footer={
            <>
              <span />
              <Button type="submit" form="idea-form">
                Add Idea
              </Button>
            </>
          }
        >
          <form id="idea-form" onSubmit={handleAddIdea} className="form-stack">
            <label>
              Idea title
              <input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="What's your idea?"
                required
                autoFocus
              />
            </label>
            <label>
              Description
              <textarea
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe your idea in detail"
              />
            </label>
            <div className="form-row">
              <label>
                Category
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Author
                <select
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                >
                  <option value="Ben Joona">Ben Joona</option>
                  <option value="Noah">Noah</option>
                </select>
              </label>
            </div>
          </form>
        </Modal>
      )}
    </section>
  );
}
