# NOVA Online Shopping Application

## Project setup

1. Install Node.js (LTS).
2. Open a terminal in the project root.
3. Install backend dependencies:

   ```bash
   npm install
   ```

4. Create `backend/.env` using `.env.example` as a reference:

   ```env
   PORT=5000
   FIREBASE_API_KEY=YOUR_FIREBASE_WEB_API_KEY
   ```

5. Place the Firebase Admin service-account JSON at the location expected by
   `backend/config/firebase.js`:

   `../nova-private/serviceAccountKey.json` (a private sibling folder next to
   the project directory).

6. Start the backend:

   ```bash
   npm start
   ```

7. Open the `frontend` folder with VS Code Live Server. Start from
   `frontend/index.html`.

## Important security notes

- Never commit `backend/.env` or the Firebase service-account JSON.
- Keep `nova-private` outside the project and outside Git.
- The current admin page is a UI, not an authorization boundary. The backend
  routes currently verify Firebase authentication tokens but do not enforce
  an administrator role. Add server-side admin claims/role checks before
  exposing admin operations in a real deployment.
- This project uses Firebase Authentication and Firestore through the
  Firebase Admin SDK on the backend.

## Integration fixes included in this reviewed copy

- Connected the products page to `api.js` and `auth.js`.
- Aligned the products JavaScript with the existing product-page element IDs
  and category-chip interface.
- Added the checkout form expected by `checkout.js` to the orders page.
- Added product ID generation in the admin product form so the backend's
  product-creation API receives the required ID.
- Made the admin product description required and allowed product active
  status to be updated by the backend.
- Added supporting styles for the updated product cards and checkout area.

JavaScript syntax checks passed for the backend and browser scripts (excluding
`frontend/js/firebase.js`, which is an ES module intended for browser loading).
This is a static integration review; a live Firebase end-to-end run has not
been performed.

## Product Image Assets

The frontend includes locally stored product images in `frontend/assets/images/` for all eight seeded products. Product documents in Firestore store relative paths such as `assets/images/wireless-headphones.webp` in the `imageUrl` field.

After updating or creating the Firebase database, run the seed script from the project root to add the image paths to the existing seeded product documents:

```bash
node database/seed.js
```

The seed script uses merge writes, so it updates the seeded product fields without deleting other documents. Keep the Firebase service-account JSON outside the project in the private location expected by `database/seed.js` and `backend/config/firebase.js`. Never commit service-account credentials or `.env` files.

When adding a product from the admin dashboard, use the **Product Image Path / URL** field. For a local image, place the file in `frontend/assets/images/` and enter a path relative to the frontend page, for example `assets/images/my-product.webp`.


## NOVA invoice email setup

The application generates an invoice only when an order's payment status is `paid`.
For a paid order, the frontend calls `POST /api/billing/generate/:orderId`; the backend
stores the invoice in Firestore and emails it to the customer's registered email address.

Install the email dependency from the project root:

```bash
npm install nodemailer
```

Add these settings to `backend/.env` (use your own SMTP credentials):

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-google-app-password
SMTP_FROM=NOVA Online Shopping <your-email@gmail.com>
```

For Gmail, create an App Password after enabling 2-Step Verification. Do not use your
normal Gmail password, and never commit `backend/.env` to GitHub.

If SMTP is not configured, the invoice is still saved in Firestore and can be viewed
and printed from My Orders, but it will not be emailed.

Note: the current project supports Cash and Credit order methods. Cash orders are
currently marked `paid` by the existing order API. Credit orders remain `pending`;
they will not receive an invoice email until a real payment-confirmation workflow
updates their payment status to `paid`. No payment gateway is configured in this project.


## NOVA Administrator Account Setup

Do not use a shared hard-coded administrator password. Create the administrator account in your private `backend/.env` file:

```env
ADMIN_EMAIL=your-admin-email@example.com
ADMIN_PASSWORD=UseAUniquePasswordAtLeast12Characters
ADMIN_NAME=NOVA Administrator
```

Then run once from the project root:

```bash
npm run create-admin
```

The script creates or promotes the Firebase Authentication account, assigns the Firebase custom claim `admin: true`, and writes the matching profile to the Firestore `admins` collection. It prints the administrator email and Firebase UID. The password is the value you chose for `ADMIN_PASSWORD`; remove that variable from `.env` after setup.

At the NOVA login page, choose **Admin? Sign in to the Admin Portal**. Use the email and password you configured. The Admin Dashboard checks the verified admin claim before loading.

Only run this script yourself on a trusted machine. Never commit `.env` or the Firebase service-account JSON.


## Create the NOVA administrator account

1. Copy `backend/.env.example` to `backend/.env`.
2. Keep your Firebase API key and Firebase service-account file private.
3. In `backend/.env`, set `ADMIN_EMAIL` to `heeranyarajagopal@gmail.com` and replace `ADMIN_PASSWORD` with a new, unique password of at least 12 characters. Do not commit `.env` or share the password.
4. From the repository root (the folder containing `package.json`), run `npm install` and then `npm run create-admin`.
5. After the script succeeds, remove `ADMIN_PASSWORD` from `backend/.env`. The Firebase account and custom admin claim remain in Firebase.
6. Sign in through the Admin Sign In option on `frontend/index.html`. Sign out and sign in again after assigning the admin claim so Firebase issues a fresh ID token.

The bootstrap script creates the Firebase user if it does not exist, or updates the password of the existing account to the value configured in `ADMIN_PASSWORD`, then assigns the `admin: true` custom claim and writes the admin profile.
