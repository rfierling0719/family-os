export default function Home() {
  return (
    <main className="shell">
      <aside>
        <h2>🏠 Family OS</h2><small>Cloudflare-ready v1</small>
        <nav>
          <a href="#today">🏠 Today</a><a href="#calendar">📅 Calendar</a><a href="#tasks">✅ Tasks</a>
          <a href="#meals">🍽️ Meals</a><a href="#shopping">🛒 Shopping</a><a href="#home">🏡 Home</a><a href="#assistant">🧠 Assistant</a>
        </nav>
      </aside>
      <section className="main">
        <header><div><h1>Good morning</h1><p>Your household command center.</p></div><a className="btn" href="/api/google/auth/start">Connect Google Calendar</a></header>
        <div className="grid">
          <article><h3>Today</h3><p>Connect Google Calendar to bring your family schedule into this dashboard.</p></article>
          <article><h3>Your attention</h3><ul><li>Pick up groceries</li><li>Replace HVAC filter</li><li>Complete school form</li></ul></article>
          <article><h3>Wife&apos;s attention</h3><ul><li>Book dentist appointment</li><li>Birthday gift</li></ul></article>
          <article><h3>Tonight</h3><b>Chicken Mediterranean bowls</b><p>Rice, cucumber, tomato, feta.</p></article>
          <article><h3>Household alerts</h3><p>🟡 Dishwasher pods are low.</p><p>🔧 HVAC filter due this week.</p></article>
          <article><h3>What am I forgetting?</h3><p>Birthday gift, dentist confirmation and dishwasher pods need attention.</p></article>
        </div>
      </section>
    </main>
  );
}
