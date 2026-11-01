const GUIDES: Record<string, { question: string; answer: string }[]> = {
  'react-remote-jobs': [
    {
      question: 'What should I compare in a remote React role?',
      answer:
        'Check whether the role focuses on a browser interface or also includes backend ownership. Look for the employer’s requirements around TypeScript, testing, accessibility, and the framework used to ship the application. A React mention alone does not describe the full role.',
    },
    {
      question: 'How can I make my React application more relevant?',
      answer:
        'Choose a project that shows the work requested in the listing. Explain one component or feature you built, how you tested it, and a tradeoff you made around performance or usability. Link to a working example or code you are allowed to share.',
    },
  ],
  'python-remote-jobs': [
    {
      question: 'Which kind of Python work is this role about?',
      answer:
        'Read the responsibilities before comparing job titles. Python can be used for web services, automation, data analysis, or machine learning. Check which of these the team needs, what tools surround Python, and whether the role includes production support.',
    },
    {
      question: 'What should I highlight when applying?',
      answer:
        'Use an example close to the employer’s work: an API for a backend role, a repeatable analysis for a data role, or a tested pipeline for an automation role. Explain how you handled errors, tested the result, and documented it for teammates.',
    },
  ],
  'frontend-remote-jobs': [
    {
      question: 'How do frontend responsibilities differ between roles?',
      answer:
        'Some roles focus on product interfaces; others include design systems, performance, or full stack delivery. Check the browser and device support expected, the testing setup, and who owns design and accessibility decisions.',
    },
    {
      question: 'What makes a useful frontend portfolio example?',
      answer:
        'Show an interface that works on mobile and with a keyboard, then explain your contribution. Include the original problem, a design or engineering tradeoff, and how you checked the result. Only claim improvements you actually measured.',
    },
  ],
  'backend-remote-jobs': [
    {
      question: 'What should I look for beyond the backend language?',
      answer:
        'Compare the database, service architecture, deployment environment, and operational responsibilities. Ask whether on-call work is required and which time zones the team covers. These details can change the day-to-day role more than the language itself.',
    },
    {
      question: 'Which experience should I bring into my application?',
      answer:
        'Describe a service or API you owned and how you handled correctness, failures, or changing requirements. Explain your role in testing and operating it. Include scale or reliability figures only when you can substantiate them.',
    },
  ],
  'node-remote-jobs': [
    {
      question: 'Is this a Node.js backend or full stack position?',
      answer:
        'Check whether the listing expects frontend delivery alongside Node.js services. Compare TypeScript requirements, databases, API design, asynchronous processing, and deployment responsibilities before deciding whether the role fits.',
    },
    {
      question: 'What project details are useful to share?',
      answer:
        'Show how you built and tested an endpoint, background task, or integration. Explain validation, error handling, and how you observed failures in production or testing. A focused explanation of your decisions is more informative than a long tool list.',
    },
  ],
  'react-native-remote': [
    {
      question: 'What mobile responsibilities should I check?',
      answer:
        'Look for iOS and Android expectations, native module work, device testing, and app store releases. Confirm whether the team uses Expo or maintains native projects, and whether you would own release and crash monitoring work.',
    },
    {
      question: 'What should my application demonstrate?',
      answer:
        'Share a mobile feature you built and explain how it behaved on real devices. Discuss a relevant decision around navigation, offline behavior, accessibility, or platform differences. Identify your own contribution if it was a team project.',
    },
  ],
  'data-analyst-remote': [
    {
      question: 'How do I compare data analyst opportunities?',
      answer:
        'Check the business questions the analyst supports, the expected SQL and reporting tools, and how much work involves preparing data versus explaining results. Look for the stakeholders you would work with and how the team defines its metrics.',
    },
    {
      question: 'What is a useful analysis example to include?',
      answer:
        'Start with the question, show how you checked data quality, and explain the conclusion and its limits. Use public or anonymized data that you are allowed to share. A clear explanation of uncertainty is part of a strong analysis.',
    },
  ],
  'technical-lead-remote': [
    {
      question: 'Does technical lead mean people management?',
      answer:
        'The title can describe a hands-on technical lead, a team manager, or a combination. Read the listing for coding expectations, direct reports, architecture responsibility, and hiring or performance-review duties. Confirm the balance with the employer.',
    },
    {
      question: 'What experience should I make visible?',
      answer:
        'Choose an example of a technical decision or delivery challenge involving other people. Explain the constraints, how you reached agreement, and what you personally did. Include how you supported teammates and followed up on the outcome.',
    },
  ],
};

export default function CategoryGuide({ slug }: { slug: string }) {
  const questions = GUIDES[slug];
  if (!questions) return null;
  return (
    <section className="faq-section" aria-labelledby="category-guide-heading">
      <div>
        <p className="eyebrow">Before you apply</p>
        <h2 id="category-guide-heading">Find the right fit.</h2>
      </div>
      <div>
        {questions.map(({ question, answer }) => (
          <details key={question}>
            <summary>
              {question}
              <span aria-hidden="true">+</span>
            </summary>
            <p>{answer}</p>
          </details>
        ))}
        <details>
          <summary>
            Can I apply from my country?<span aria-hidden="true">+</span>
          </summary>
          <p>
            Check each listing’s location, working hours, and work authorization requirements. A
            remote role may be limited to specific countries or time zones. Confirm eligibility and
            availability on the original listing before applying.
          </p>
        </details>
      </div>
    </section>
  );
}
