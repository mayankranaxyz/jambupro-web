export default function DeleteAccountPage() {
  return (
    <main
      style={{
        padding: "40px 20px",
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
        lineHeight: 1.7,
      }}
    >
      <div style={{ maxWidth: 860, margin: "0 auto" }}>
        <h1>Delete Your Account — Jambu Pro</h1>
        <p>
          This page explains how to request deletion of your Jambu Pro account and related
          data.
        </p>

        <h2>Option A: Remove account from this device (in-app)</h2>
        <p>
          If you want to log out and remove your session and cached data from your phone:
        </p>
        <ol>
          <li>Open the Jambu Pro app</li>
          <li>Go to <strong>Profile → Settings</strong></li>
          <li>Tap <strong>“Remove Account From Device”</strong></li>
          <li>Confirm</li>
        </ol>
        <p>
          <strong>What this does:</strong> It removes your login session and local app data
          from the device.
        </p>

        <h2>Option B: Request permanent deletion (contact support)</h2>
        <p>
          If you want your account and associated data to be permanently deleted from our
          servers, contact support:
        </p>
        <ul>
          <li>
            Email: <a href="mailto:support@jambupro.com">support@jambupro.com</a>
          </li>
          <li>Include your registered phone number in the email</li>
          <li>Subject suggestion: <strong>“Account Deletion Request”</strong></li>
        </ul>

        <h2>Deletion timeline</h2>
        <ul>
          <li>We process deletion requests within <strong>7 working days</strong>.</li>
          <li>
            Backup data (if any) is deleted on a rolling basis and typically within{" "}
            <strong>30 days</strong>.
          </li>
        </ul>

        <h2>Data that may be deleted</h2>
        <ul>
          <li>Profile information (name, email, business details, images URLs)</li>
          <li>CRM contacts/leads and related notes/status</li>
          <li>Support tickets/messages (if any)</li>
        </ul>

        <h2>Data that may be retained</h2>
        <p>
          We may retain limited information if required for legal compliance, fraud
          prevention, or dispute resolution.
        </p>

        <h2>Important notes</h2>
        <ul>
          <li>Permanent deletion is irreversible.</li>
          <li>
            If you only remove the account from your device (Option A), it does not
            automatically confirm a server-side deletion request.
          </li>
        </ul>

        <p>
          <em>Last updated: April 2026</em>
        </p>
      </div>
    </main>
  );
}
