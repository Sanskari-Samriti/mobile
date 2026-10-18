# Android Staging CI/CD

Pushing to the `staging` branch (or manually starting the **Staging builds**
GitHub Actions workflow) builds an Android APK with EAS and distributes it to
the configured Firebase App Distribution tester group.

Apple/TestFlight CI is intentionally not part of this workflow yet. It can be
added later when Apple Developer and App Store Connect credentials are ready.

## One-time setup

1. Create or sign in to an Expo account and link this app to an EAS project:

   ```sh
   npx eas-cli@latest login
   npx eas-cli@latest init
   ```

   This must replace `YOUR_EAS_PROJECT_ID` in `app.json` with the linked EAS
   project ID.

2. Create an Expo access token and add it to the GitHub repository as the
   `EXPO_TOKEN` Actions secret.

3. In the EAS project, create `EXPO_PUBLIC_SUPABASE_URL` and
   `EXPO_PUBLIC_SUPABASE_ANON_KEY` for the `preview` environment. The staging
   build profile uses EAS's built-in `preview` environment so this works on the
   free plan. Cloud builds cannot read the developer's local `.env` file.

4. Create a Firebase project and register the Android app with package ID
   `com.sanskarisamriti.app`. Enable App Distribution and create a tester group.
   Create a Google service account with the Firebase App Distribution
   administrator role, then add:

   - `FIREBASE_SERVICE_ACCOUNT_JSON` as a GitHub Actions secret containing the
     service account JSON.
   - `FIREBASE_APP_ID` as a GitHub Actions repository variable with the Firebase
     Android app ID.
   - `FIREBASE_TESTER_GROUP` as a GitHub Actions repository variable with the
     tester group alias.

5. Push a commit to the `staging` branch. The workflow builds the APK and sends
   it to the Firebase tester group. EAS uses remote versioning and increments
   each staging build.

The EAS free plan currently includes 15 Android builds per month, with a
low-priority build queue. This setup uses GitHub Actions to coordinate the
pipeline and EAS Build for the native build; standard GitHub Actions runners
are free for public repositories, while private repositories have monthly
included minutes based on the GitHub plan.
