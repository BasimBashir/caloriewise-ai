# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

## Run Locally with ngrok (for Mobile & External Device Testing)

To test features like Google Sign-In or camera access on a mobile device, you need a secure, public URL that points to your local server. This project is configured to do this for you automatically using **ngrok**.

**Prerequisites:**
*   Node.js
*   [ngrok](https://ngrok.com/download)

---

### **Step 1: Install Dependencies**
```bash
npm install
```

---

### **Step 2: Set Up Environment Variables**

Create a file named `.env.local` in the root of your project and add your API keys.

```.env.local
# Get your Gemini API Key from AI Studio
API_KEY=YOUR_GEMINI_API_KEY_HERE

# Get your Google Search API Key from the Google Cloud Console
GOOGLE_SEARCH_API_KEY=YOUR_GOOGLE_SEARCH_API_KEY_HERE

# 1. Get your Search Engine ID from https://programmablesearchengine.google.com/controlpanel/all
# 2. In your search engine's setup, make sure to enable "Image search".
# 3. Also in setup, ensure "Search the entire web" is turned ON.
GOOGLE_CSE_ID=YOUR_GOOGLE_CSE_ID_HERE
```

---

### **Step 3: Set Up Google Firebase for Data Storage**

This application uses Google Firestore to save user data and sync it across devices. You'll need to set up a free Firebase project.

1.  Go to the [Firebase Console](https://console.firebase.google.com/) and click **"Add project"**.
2.  Follow the on-screen instructions to create your project. You can disable Google Analytics if you wish.
3.  Once your project is created, go to the project dashboard. Click on the **Web icon (`</>`)** to add a web app to your project.
4.  Give your app a nickname (e.g., "CalorieWise AI") and click **"Register app"**.
5.  Firebase will provide you with a configuration object (`firebaseConfig`). **Copy this entire object.**
6.  Open the file `firebaseConfig.ts` in the root of your project.
7.  Paste the configuration object into `firebaseConfig.ts`, replacing the placeholder values.

8.  **Enable Google Sign-In:**
    *   In the Firebase console, go to the **Build > Authentication** section.
    *   Click the **"Get started"** button.
    *   In the **Sign-in method** tab, select **Google** from the list of providers.
    *   **Enable** the Google provider.
    *   Select a **Project support email**.
    *   Click **Save**.

9.  **Set Up Firestore Database:**
    *   In the Firebase console, go to the **Build > Firestore Database** section.
    *   Click **"Create database"**.
    *   Choose to start in **Production mode**.
    *   Select a location for your database (choose the one closest to you).
    *   Go to the **Rules** tab in Firestore and paste the following rules. This ensures users can only read and write their own data.
    ```
    rules_version = '2';
    service cloud.firestore {
      match /databases/{database}/documents {
        match /users/{userId} {
          allow read, write: if request.auth.uid == userId;
        }
      }
    }
    ```
    *   Click **Publish**. Your database is now ready.

---

### **Step 4: Set Up ngrok**

1.  **Download ngrok** from the [official website](https://ngrok.com/download).
2.  Unzip the file and place the `ngrok` executable (e.g., `ngrok.exe`) in the **root directory of this project**.
3.  (Recommended) Sign up for a free ngrok account and authenticate it to get longer, more stable session times. Follow the instructions on their site.

---

### **Step 5: Run the Development Server**

Run the following command. It will start both the Vite server and the ngrok tunnel simultaneously using `npm-run-all`.

```bash
npm run dev
```

In your terminal, you will see output from both services. Look for the `ngrok` output, which will provide you with a public URL.

```
Forwarding                    https://<RANDOM_SUBDOMAIN>.ngrok-free.app -> https://localhost:5173
```

---

### **Step 6: Configure Authentication Providers**

To allow users to sign in, you must authorize the URL provided by ngrok.

1.  Copy the **`https://` ngrok URL** from your terminal (e.g., `https://<random-id>.ngrok-free.app`). **Do not include the trailing slash.**

2.  **Authorize the domain in Firebase:**
    *   Go to your [Firebase Console](https://console.firebase.google.com/).
    *   Navigate to **Build > Authentication**.
    *   Click the **Settings** tab.
    *   Select **Authorized domains**.
    *   Click **Add domain** and paste your ngrok domain (e.g., `<random-id>.ngrok-free.app`).

3.  **Authorize the domain in Google Cloud:**
    *   Go to your [Google Cloud Credentials page](https://console.cloud.google.com/apis/credentials).
    *   Find and edit your **OAuth 2.0 Client ID**.
    *   Under **"Authorized JavaScript origins,"** click **ADD URI** and paste your full `https://` ngrok URL.

4.  Save all changes. You can now open the `ngrok` URL on any device to test Google Sign-In.

**Note:** The free version of `ngrok` generates a new URL every time you restart the server. You will need to update this URL in both Firebase and Google Cloud Console each time.