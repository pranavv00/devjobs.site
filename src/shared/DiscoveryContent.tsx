import { ArrowUpRight, Bookmark, Search, Send } from 'lucide-react';
import { CATEGORIES, FAQS } from './seo';
export function CategoryLinks() {
  return (
    <section className="category-section">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Follow your interests</p>
          <h2>Find your corner of tech.</h2>
        </div>
      </div>
      <div className="category-grid">
        {CATEGORIES.slice(0, 6).map((c) => (
          <a href={`/q/${c.slug}`} key={c.slug}>
            {c.title}
            <ArrowUpRight size={18} aria-hidden="true" />
          </a>
        ))}
      </div>
    </section>
  );
}
export function HowItWorks() {
  return (
    <section className="how-section">
      <div>
        <p className="eyebrow">A little less friction</p>
        <h2>
          From “what if”
          <br />
          to your next move.
        </h2>
        <a href="/about" className="text-link">
          More about DevJobs <ArrowUpRight size={16} aria-hidden="true" />
        </a>
      </div>
      <div className="how-steps">
        {[
          {
            icon: Search,
            title: 'Find your fit',
            text: 'Search roles from established job boards. Filter by your skills and what matters to you.',
          },
          {
            icon: Bookmark,
            title: 'Keep the good ones',
            text: 'Save a shortlist and track applications, interviews, and offers in one place.',
          },
          {
            icon: Send,
            title: 'Make your move',
            text: 'Go straight to the original listing to confirm the details and apply.',
          },
        ].map(({ icon: Icon, title, text }, i) => (
          <div key={title}>
            <span className="step-icon">
              <Icon size={19} aria-hidden="true" />
            </span>
            <div>
              <span className="step-number">0{i + 1}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
export function FaqSection() {
  return (
    <section className="faq-section" aria-labelledby="faq-heading">
      <div>
        <p className="eyebrow">Good questions</p>
        <h2 id="faq-heading">A few things to know.</h2>
      </div>
      <div>
        {FAQS.map((faq) => (
          <details key={faq.question}>
            <summary>
              {faq.question}
              <span aria-hidden="true">+</span>
            </summary>
            <p>{faq.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
