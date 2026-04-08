export default function PrivacyPolicy() {
  return (
    <main
      style={{
        padding: "40px 20px",
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
        lineHeight: 1.7,
      }}
    >
      <div style={{ maxWidth: 860, margin: "0 auto" }}>
        <h1>Privacy Policy — Jambu Pro</h1>

        <p>
          Jambu Pro is a property dealer management application designed to help real estate
          professionals calculate deals, manage leads, and organize business information.
        </p>

        <h2>1) Summary</h2>
        <ul>
          <li>We use your mobile number for OTP-based login.</li>
          <li>
            The app can store data locally for offline use and can sync certain data to our
            servers for backup/continuity.
          </li>
          <li>
            If you upload images (profile/company logo), they are stored on Cloudinary and we
            store the image URL in our database.
          </li>
          <li>We do not sell your personal data.</li>
        </ul>

        <h2>2) Information we collect</h2>
        <h3>Information you provide</h3>
        <ul>
          <li>Mobile number (for registration and OTP login)</li>
          <li>Profile details (name, email, user type, address, business details)</li>
          <li>CRM contacts/leads you add or import (name, phone, notes, follow-up, status)</li>
          <li>Support messages when you contact us</li>
        </ul>

        <h3>Images</h3>
        <p>
          If you upload a profile picture or company logo, we upload the image to Cloudinary.
          We then store the resulting URL so we can display it in the app.
        </p>

        <h2>3) How we use information</h2>
        <ul>
          <li>To authenticate users and prevent misuse (OTP login)</li>
          <li>To save and sync your profile and CRM data</li>
          <li>To provide app features such as calculators, CRM, and visiting card tools</li>
          <li>To provide customer support</li>
        </ul>

        <h2>4) Offline storage &amp; sync</h2>
        <p>
          The app stores some data on your device for faster performance and offline support.
          When internet is available, the app may sync certain data (for example, profile
          information and CRM leads) to servers for backup and continuity.
        </p>

        <h2>5) Sharing &amp; third-party services</h2>
        <p>
          We share information only as needed to provide the service, such as through these
          providers:
        </p>
        <ul>
          <li>OTP SMS provider (to send/verify OTP)</li>
          <li>Cloudinary (to host uploaded images)</li>
        </ul>

        <h2>6) Data retention</h2>
        <p>
          We retain your data for as long as your account is active or as needed to provide
          the service. You can request permanent deletion (see the Account Deletion section).
        </p>

        <h2>7) Security</h2>
        <p>
          We take reasonable measures to protect your data. Please keep your device secure
          and do not share your OTP with anyone.
        </p>

        <h2>8) Your choices</h2>
        <ul>
          <li>You can update your profile information from within the app.</li>
          <li>You can log out or remove the account from your device to clear local session data.</li>
          <li>
            You can request permanent deletion by following the instructions on the{" "}
            <a href="/delete-account">Delete Account</a> page.
          </li>
        </ul>

        <h2>9) Children’s privacy</h2>
        <p>
          Jambu Pro is not intended for children. We do not knowingly collect personal data
          from children.
        </p>

        <h2>10) Changes to this policy</h2>
        <p>
          We may update this privacy policy when app features change. Continued use of the app
          indicates acceptance of the updated policy.
        </p>

        <h2>11) Contact</h2>
        <p>
          For questions or support, contact{" "}
          <a href="mailto:support@jambupro.com">support@jambupro.com</a>.
        </p>

        <p>
          <em>Last updated: April 2026</em>
        </p>
      </div>
    </main>
  );
}
