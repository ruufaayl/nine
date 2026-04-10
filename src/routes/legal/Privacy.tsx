// ──────────────────────────────────────────────
// Privacy Policy — NINE
// ──────────────────────────────────────────────

import { AuthShell } from '../../components/Auth/AuthShell';
import { motion } from 'framer-motion';

export default function Privacy() {
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
          Privacy Policy
        </h1>
        <p
          className="text-[0.65rem] font-semibold uppercase tracking-[0.15em] mb-6"
          style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-body)' }}
        >
          Last updated: April 10, 2026
        </p>

        <div
          className="flex flex-col gap-5 text-sm leading-relaxed"
          style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}
        >
          <Section title="1. Information We Collect">
            <strong>Account data:</strong> email address, username, password hash (bcrypt).
            We never store plaintext passwords.{'\n\n'}
            <strong>Gameplay data:</strong> match results, scores, XP, trophies, coins,
            game mode preferences, timestamps.{'\n\n'}
            <strong>Device data:</strong> device type, operating system, app version,
            screen resolution, and a unique device identifier for push notifications.{'\n\n'}
            <strong>Analytics:</strong> session duration, feature usage, crash reports.
            We use this to improve the app.
          </Section>

          <Section title="2. How We Use Your Data">
            We use your data to: provide and improve the game experience; match you with
            opponents of similar skill; calculate and display rankings and leaderboards;
            send you notifications about matches, challenges, and rewards (with your
            consent); detect and prevent cheating and fraud; comply with legal obligations.
          </Section>

          <Section title="3. Data Sharing">
            We do not sell your personal data. We may share data with: service providers
            who help us operate the App (hosting, analytics, push notifications); law
            enforcement when required by law; other players (username, rank, and game
            statistics are publicly visible on your profile).
          </Section>

          <Section title="4. Third-Party Services">
            NINE uses the following third-party services:{'\n\n'}
            <strong>Google Sign-In / Apple Sign-In:</strong> for authentication. Subject
            to Google/Apple privacy policies.{'\n\n'}
            <strong>Firebase Cloud Messaging:</strong> for push notifications. Subject
            to Google Cloud privacy terms.{'\n\n'}
            <strong>Vercel:</strong> for hosting. Subject to Vercel privacy policy.
          </Section>

          <Section title="5. Data Retention">
            We retain your account data for as long as your account is active. If you
            delete your account, we will remove your personal data within 30 days.
            Anonymized gameplay statistics may be retained for analytics.
          </Section>

          <Section title="6. Your Rights">
            You have the right to: access your personal data; correct inaccurate data;
            delete your account and data; export your data; opt out of push notifications
            at any time through Settings; withdraw consent for data processing (where
            consent is the basis).
          </Section>

          <Section title="7. Security">
            We use industry-standard measures to protect your data: encrypted connections
            (HTTPS/TLS), bcrypt password hashing, HttpOnly secure session cookies,
            and regular security audits. No system is 100% secure, and we cannot guarantee
            absolute security.
          </Section>

          <Section title="8. Children's Privacy">
            NINE is not intended for children under 13. We do not knowingly collect data
            from children under 13. If you believe a child under 13 has provided us with
            personal data, contact us and we will delete it.
          </Section>

          <Section title="9. International Users">
            NINE operates servers in multiple regions (US, EU, Asia). Your data may be
            transferred to and processed in countries other than your own. By using the
            App, you consent to this transfer.
          </Section>

          <Section title="10. Changes to This Policy">
            We may update this Privacy Policy from time to time. We will notify you of
            material changes via in-app notification. Continued use constitutes acceptance.
          </Section>

          <Section title="11. Contact">
            For privacy-related questions or data requests, contact us at
            privacy@playnine.io.
          </Section>
        </div>
      </motion.div>
    </AuthShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2
        className="text-sm font-bold mb-1.5"
        style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}
      >
        {title}
      </h2>
      <p className="whitespace-pre-line">{children}</p>
    </div>
  );
}
