export default function PrivacyPolicy() {
  return (
    <main style={{ padding: "40px", fontFamily: "sans-serif", lineHeight: 1.6 }}>
      <h1>Privacy Policy — Jambu Pro</h1>

      <p>
        Jambu Pro is a property dealer management application designed to help
        real estate professionals calculate deals, manage leads, and organize
        business information efficiently.
      </p>

      <h2>Information Collection</h2>
      <p>
        Jambu Pro collects and processes certain information to provide core
        features such as OTP login, profile management, and CRM lead sync. Data
        may be stored both on your device (for offline access) and on our
        servers (for backup and sync across sessions/devices).
      </p>

      <h2>Information You Provide</h2>
      <ul>
        <li>Mobile number for registration and OTP-based login</li>
        <li>Profile details (name, email, user type, address, business details)</li>
        <li>CRM contacts/leads you add or import (name, phone, notes, status)</li>
        <li>Support messages when you contact us</li>
      </ul>

      <h2>Images</h2>
      <p>
        If you upload a profile picture or company logo, the image is uploaded to a
        secure cloud media service (Cloudinary) and we store only the image URL in
        the database to show it in the app.
      </p>

      <h2>Data Usage</h2>
      <p>
        The information you enter is used only to provide app features such as
        calculators, deal summaries, visiting cards, and CRM tools. Data
        remains under your control and is not sold.
      </p>

      <h2>Local Storage (Offline Support)</h2>
      <p>
        App data is stored locally on your device to improve performance and
        user experience and to support offline usage. When internet is available,
        the app may sync certain data (e.g., profile and CRM leads) with the server.
        You may remove local data by logging out, clearing app storage, or uninstalling
        the app.
      </p>

      <h2>Third-Party Services</h2>
      <ul>
        <li>OTP SMS provider (for sending/validating login OTP)</li>
        <li>Cloudinary (for image uploads: profile photo/company logo)</li>
      </ul>

      <h2>Security</h2>
      <p>
        We take reasonable measures to protect your data. Access to protected
        features requires authentication. Please keep your device secure and do not
        share your OTP with anyone.
      </p>

      <h2>Your Choices</h2>
      <ul>
        <li>You can update your profile information from within the app.</li>
        <li>You can log out to remove your session on the device.</li>
      </ul>

      <h2>Account Deletion</h2>
      <p>
        For instructions on how to request account deletion, please visit the{" "}
        <a href="/delete-account">Delete Account</a> page.
      </p>

      <h2>Changes to This Policy</h2>
      <p>
        This privacy policy may be updated when app features change. Continued
        use of the app indicates acceptance of the updated policy.
      </p>

      <h2>Contact</h2>
      <p>
        For questions or support, contact:{" "}
        <a href="mailto:support@jambupro.com">support@jambupro.com</a>
      </p>

      <p>
        By using Jambu Pro, you agree to this privacy policy.
      </p>

      <p>
        <em>Last updated: April 2026</em>
      </p>
    </main>
  );
}
