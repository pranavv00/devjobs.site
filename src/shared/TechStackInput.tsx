'use client';
import { useId, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { useSkills } from './storage';
export default function TechStackInput() {
  const { skills, saveSkills } = useSkills();
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const id = useId();
  function save(next: string[]) {
    setError(saveSkills(next) ? '' : 'Could not save skills. Browser storage may be disabled.');
  }
  return (
    <section className="skills-panel" aria-labelledby={`${id}-label`}>
      <h2 id={`${id}-label`}>Your tech stack</h2>
      <p>
        Add up to 20 skills to find roles with similar requirements. Matching uses keywords, not AI
        predictions.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const next = value
            .split(',')
            .map((s) => s.trim().toLowerCase())
            .filter(Boolean);
          if (next.length && skills.length < 20) {
            save([...skills, ...next]);
            setValue('');
          }
        }}
        className="skill-form"
      >
        <label htmlFor={id} className="sr-only">
          Add a skill
        </label>
        <input
          id={id}
          value={value}
          maxLength={120}
          placeholder="e.g. React, Python, SQL"
          onChange={(e) => setValue(e.target.value)}
          disabled={skills.length >= 20}
        />
        <button
          className="button button-secondary"
          type="submit"
          disabled={!value.trim() || skills.length >= 20}
        >
          <Plus size={16} aria-hidden="true" />
          Add skill
        </button>
      </form>
      <div className="skill-tags">
        {skills.map((skill) => (
          <span key={skill}>
            {skill}
            <button
              type="button"
              aria-label={`Remove ${skill}`}
              onClick={() => save(skills.filter((s) => s !== skill))}
            >
              <X size={14} aria-hidden="true" />
            </button>
          </span>
        ))}
      </div>
      {error && (
        <p role="alert" className="field-error">
          {error}
        </p>
      )}
    </section>
  );
}
