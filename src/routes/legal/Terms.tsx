// ──────────────────────────────────────────────
// Terms of Service — NINE
// ──────────────────────────────────────────────

import { AuthShell } from '../../components/Auth/AuthShell';
import { motion } from 'framer-motion';

export default function Terms() {
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
          Terms of Service
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
          <Section title="1. Acceptance of Terms">
            By downloading, installing, or using NINE ("the App"), you agree to be
            bound by these Terms of Service. If you do not agree, do not use the App.
          </Section>

          <Section title="2. Eligibility">
            You must be at least 13 years old to use NINE. If you are between 13 and
            18, you must have parental or guardian consent. By using the App, you represent
            that you meet these requirements.
          </Section>

          <Section title="3. Account Registration">
            You may create an account using email, Google, or Apple sign-in. You are
            responsible for maintaining the security of your credentials. One account
            per person. Multiple accounts may be suspended without notice.
          </Section>

          <Section title="4. In-App Currency & Purchases">
            NINE features virtual currencies (Coins, Gems) and virtual items. These have
            no real-world monetary value and cannot be exchanged for real currency.
            All purchases of Gems are final and non-refundable except as required by
            applicable law. We reserve the right to modify virtual economy values,
            pricing, and availability at any time.
          </Section>

          <Section title="5. Fair Play">
            You agree not to: use bots, cheats, exploits, or automation tools; manipulate
            matchmaking by intentionally losing; create multiple accounts to gain unfair
            advantage; share, sell, or trade accounts. Violation may result in permanent
            suspension.
          </Section>

          <Section title="6. User Conduct">
            You will not use the App to harass, abuse, or threaten other users; transmit
            offensive, illegal, or harmful content; impersonate others; or engage in any
            activity that disrupts the experience for other users.
          </Section>

          <Section title="7. Intellectual Property">
            All content in NINE — including game modes, visual design, code, and branding —
            is owned by the NINE team or its licensors. You may not copy, modify,
            distribute, or create derivative works without written permission.
          </Section>

          <Section title="8. Service Availability">
            We strive for 99.9% uptime but do not guarantee uninterrupted service.
            Maintenance windows, server updates, and unforeseen outages may temporarily
            affect availability. We are not liable for losses resulting from downtime.
          </Section>

          <Section title="9. Data & Privacy">
            Your use of NINE is also governed by our Privacy Policy. By using the App,
            you consent to the collection and use of data as described therein.
          </Section>

          <Section title="10. Termination">
            We may suspend or terminate your account at any time for violation of these
            Terms or for any reason at our discretion. You may delete your account at
            any time through the Settings page.
          </Section>

          <Section title="11. Limitation of Liability">
            NINE is provided "as is" without warranties of any kind. To the maximum extent
            permitted by law, we shall not be liable for any indirect, incidental, or
            consequential damages arising from your use of the App.
          </Section>

          <Section title="12. Changes to Terms">
            We may update these Terms at any time. Continued use of the App after changes
            constitutes acceptance. We will notify users of material changes via in-app
            notification.
          </Section>

          <Section title="13. Contact">
            Questions about these Terms? Contact us at support@playnine.io.
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
      <p>{children}</p>
    </div>
  );
}
