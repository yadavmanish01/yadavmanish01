<div align="center">

# Manish Yadav
### Flutter developer · making apps feel like magic.

I turn useful ideas into friendly mobile apps: smooth on the surface, thoughtfully connected underneath.

<br />

[![GitHub](https://img.shields.io/badge/EXPLORE_MY_CODE-GitHub-171b20?style=for-the-badge&logo=github&logoColor=c8fa78)](https://github.com/yadavmanish01)
[![Email](https://img.shields.io/badge/LET’S_TALK-Email-171b20?style=for-the-badge&logo=gmail&logoColor=c8fa78)](mailto:imyadavmanish01@gmail.com)

</div>

---

## What I bring to an app

Think of an app as a little world. I build its screens, connect it to useful services, and add the details that make it feel easy to use.

| The app needs to… | I work with… |
| --- | --- |
| Welcome people back to their account | Firebase Authentication |
| Send a timely update | Firebase Cloud Messaging (FCM) |
| Understand which features are useful | Firebase Analytics |
| Spot and fix crashes | Firebase Crashlytics |
| Check app requests and protect services | Firebase App Check |
| Adjust selected experiences remotely | Firebase Remote Config |
| Fetch live information from other services | REST APIs, HTTP, Dio |
| Build and organize Flutter projects | Flutter, Dart, Get CLI |

## How I like to build

**Start with people.** Make the purpose clear and the flow easy to follow.  
**Connect the pieces.** Bring together the interface, APIs, and Firebase services.  
**Polish the feeling.** Use animation and thoughtful details to make interactions feel natural.

## My toolkit

`Flutter` · `Dart` · `Firebase` · `FCM` · `Crashlytics` · `Analytics` · `Authentication` · `App Check` · `Remote Config` · `HTTP` · `Dio` · `Get CLI` · `GetX` · `BLoC` · `Git`

## Projects

The portfolio site includes a public project gallery and an admin-only upload form. Project name is required; description, services, and link are optional. Logo uploads are disabled until Firebase Storage is enabled.

### Connect the project gallery to Firebase

1. In the [Firebase console](https://console.firebase.google.com/), create or open a Firebase project.
2. Open **Project settings → General → Your apps**, add a **Web app**, and copy its Firebase configuration.
3. Replace the example values in `firebase-config.js` with the web app configuration. Set `adminEmail` to the exact email address you will use to sign in. Firebase web app configuration is public; never put an account password or service-account key in this file.
4. In **Authentication → Sign-in method**, enable **Email/Password**. In **Users**, add your admin account and set its password.
5. Create a **Cloud Firestore** database and enable **Storage** for the project.
6. Publish these Firestore rules, replacing `YOUR_ADMIN_EMAIL` with the same admin email:

   ```text
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /projects/{projectId} {
         allow read: if true;
         allow create, update, delete: if request.auth != null
           && request.auth.token.email == 'YOUR_ADMIN_EMAIL';
       }
     }
   }
   ```

7. Publish these Storage rules with the same email. They make uploaded project logos publicly viewable but restrict uploads and deletes to the admin:

   ```text
   rules_version = '2';
   service firebase.storage {
     match /b/{bucket}/o {
       match /projects/{adminUid}/{fileName} {
         allow read: if true;
         allow write: if request.auth != null
           && request.auth.token.email == 'YOUR_ADMIN_EMAIL'
           && request.auth.uid == adminUid
           && (request.resource == null
             || (request.resource.size < 5 * 1024 * 1024
               && request.resource.contentType.matches('image/.*')));
       }
     }
   }
   ```

8. Deploy the site with `index.html`, `projects.js`, and `firebase-config.js` in the same directory. Open the **Projects** section, sign in with your Firebase admin email and password, and publish projects. Visitors can see published projects without signing in.

## Let’s make something useful

Open to collaborating on Flutter apps and real-world product ideas.

<div align="center">

[GitHub](https://github.com/yadavmanish01) &nbsp; · &nbsp; [Email Manish](mailto:imyadavmanish01@gmail.com)

</div>
