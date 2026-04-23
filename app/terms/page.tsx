export default function TermsPage() {
  return (
    <main
      style={{
        padding: "40px 20px",
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
        lineHeight: 1.7,
      }}
    >
      <div style={{ maxWidth: 860, margin: "0 auto" }}>
        <h1>Terms &amp; Conditions — Jambu Pro</h1>

        <p>
          By using Jambu Pro, you agree to these Terms &amp; Conditions. If you do not
          agree, please do not use the app.
        </p>

        <h2>1) Eligibility &amp; account access</h2>
        <ul>
          <li>You must use a valid mobile number to access the app.</li>
          <li>You are responsible for maintaining the security of your device.</li>
          <li>Do not share your OTP with anyone.</li>
        </ul>

        <h2>2) Acceptable use</h2>
        <ul>
          <li>Do not attempt unauthorized access, reverse engineering, or abuse of the service.</li>
          <li>Do not use the app for unlawful activities.</li>
          <li>You are responsible for the content you add (e.g., CRM notes and contacts).</li>
        </ul>

        <h2>3) Accounts, roles &amp; organizations</h2>
        <ul>
          <li>
            The app supports different user types (Individual, Organization, Organization Employee).
          </li>
          <li>
            If you create an Organization, you may be able to manage employees and assign/transfer leads
            within your organization.
          </li>
          <li>
            If you register as an Organization Employee, your access may be limited to leads assigned to you.
          </li>
        </ul>

        <h2>4) Offline storage &amp; sync</h2>
        <p>
          The app may store data locally on your device for offline use. When internet is
          available, the app may sync certain data (such as profile information and CRM
          leads) to servers for backup and continuity.
        </p>

        <h2>5) Third-party services</h2>
        <p>
          We may use third-party providers for essential features such as OTP delivery and
          image hosting (for profile/company images). These providers may process data as
          necessary to deliver their services.
        </p>

        <h2>6) Intellectual property</h2>
        <p>
          The app, branding, and associated content are owned by Jambu Pro or its licensors.
          You may not copy or redistribute them without permission.
        </p>

        <h2>7) Termination</h2>
        <p>
          We may suspend or restrict access if we reasonably believe there is misuse, fraud,
          or a violation of these terms.
        </p>

        <h2>8) Disclaimer &amp; limitation of liability</h2>
        <p>
          The app is provided “as is” without warranties of any kind. We do not guarantee
          uninterrupted or error-free operation. To the maximum extent permitted by law, we
          are not liable for indirect or consequential damages.
        </p>

        <h2>9) Changes to these terms</h2>
        <p>
          We may update these terms from time to time. Continued use of the app after
          updates means you accept the revised terms.
        </p>

        <h2>10) Contact</h2>
        <p>
          For support or questions, contact{" "}
          <a href="mailto:support@jambupro.com">support@jambupro.com</a>.
        </p>

        <p>
          <em>Last updated: April 2026</em>
        </p>
      </div>
    </main>
  );
}

