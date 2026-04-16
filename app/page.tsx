import Link from 'next/link';
import styles from './landing.module.css';

export default function LandingPage() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.logo}>
          <span className={styles.icon}>🤖</span>
          <span className={styles.text}>Wabot<span>AI</span></span>
        </div>
        <nav className={styles.nav}>
          <Link href="#features">Features</Link>
          <Link href="#pricing">Pricing</Link>
          <Link href="/login" className="btn btn-secondary">Login</Link>
          <Link href="/register" className="btn btn-primary">Start Free</Link>
        </nav>
      </header>

      <main className={styles.main}>
        <section className={styles.hero}>
          <div className={styles.badge}>Next Generation WhatsApp Automation</div>
          <h1>Empower Your Business with <span>AI-Driven</span> WhatsApp Bot</h1>
          <p>
            Manage multiple WhatsApp sessions, automate customer support with AI agents, 
            and send mass broadcasts with ease.
          </p>
          <div className={styles.cta}>
            <Link href="/register" className="btn btn-primary" style={{ padding: '14px 32px', fontSize: '1.1rem' }}>
              Get Started Now
            </Link>
            <Link href="/demo" className="btn btn-secondary" style={{ padding: '14px 32px', fontSize: '1.1rem' }}>
              View Demo
            </Link>
          </div>

          <div className={styles.dashboardPreview}>
            <div className={styles.mockup}>
              <div className={styles.mockupHeader}>
                <div className={styles.dots}><span></span><span></span><span></span></div>
              </div>
              <div className={styles.mockupBody}>
                <div className={styles.mockSidebar}></div>
                <div className={styles.mockContent}>
                  <div className={styles.mockCharts}>
                    <div className={styles.mockChart}></div>
                    <div className={styles.mockChart}></div>
                  </div>
                  <div className={styles.mockList}></div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <p>&copy; 2024 WabotAI. All rights reserved.</p>
      </footer>
    </div>
  );
}
