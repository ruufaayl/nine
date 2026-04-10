// ──────────────────────────────────────────────
// Support — NINE
// ──────────────────────────────────────────────

import { AuthShell } from '../../components/Auth/AuthShell';
import { motion } from 'framer-motion';

export default function Support() {
  return (
    <AuthShell showBack showFooter={false}>
      <motion.div
        className="px-7 py-6 max-w-lg mx-auto"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1
          className="text-2xl font-black tracking-[-0.03em] mb-1"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
        >
          Support
        </h1>
        <p
          className="text-sm mb-8"
          style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-body)' }}
        >
          Need help? We're here for you.
        </p>

        <div className="flex flex-col gap-5">
          <Card title="General Questions" email="support@playnine.io">
            Account issues, gameplay help, feature requests,
            and general inquiries.
          </Card>
          <Card title="Bug Reports" email="bugs@playnine.io">
            Found something broken? Include your device model,
            OS version, and steps to reproduce.
          </Card>
          <Card title="Privacy & Data Requests" email="privacy@playnine.io">
            Data export, account deletion, and
            privacy-related questions.
          </Card>
          <Card title="Business & Partnerships" email="hello@playnine.io">
            Sponsorships, collaborations, media inquiries,
            and partnership opportunities.
          </Card>
        </div>

        <div className="mt-10 pt-6" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <p
            className="text-[0.7rem] leading-relaxed"
            style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-body)' }}
          >
            We typically respond within 24 hours. For urgent account security issues,
            include "URGENT" in your subject line.
          </p>
        </div>
      </motion.div>
    </AuthShell>
  );
}

function Card({ title, email, children }: { title: string; email: string; children: React.ReactNode }) {
  return (
    <div
      className="p-5"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
      }}
    >
      <h3
        className="text-sm font-bold mb-1"
        style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}
      >
        {title}
      </h3>
      <p
        className="text-[0.75rem] leading-relaxed mb-3"
        style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-body)' }}
      >
        {children}
      </p>
      <a
        href={`mailto:${email}`}
        className="text-[0.75rem] font-bold"
        style={{ color: 'var(--accent-primary)', fontFamily: 'var(--font-body)' }}
      >
        {email}
      </a>
    </div>
  );
}
