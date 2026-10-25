import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import {
  deleteObject,
  getDownloadURL,
  getStorage,
  ref,
  uploadBytes
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-storage.js";
import { adminEmail, firebaseConfig } from "./firebase-config.js";

const projectSection = document.querySelector("#projects .wrap");
const projectGallery = document.createElement("div");
projectGallery.className = "project-gallery";
projectGallery.setAttribute("aria-live", "polite");

const projectAdmin = document.createElement("section");
projectAdmin.className = "project-admin";
projectAdmin.innerHTML = `
  <div class="project-admin-head">
    <div>
      <div class="eyebrow">Project showcase</div>
      <h3>Apps I’ve worked on.</h3>
    </div>
    <div class="project-admin-controls">
      <button class="button" id="project-auth-toggle" type="button">Admin sign in</button>
      <button class="button" id="project-sign-out" type="button" hidden>Sign out</button>
    </div>
  </div>
  <p class="project-status" id="project-status" role="status" aria-live="polite">Loading projects…</p>
  <div class="project-gallery-list"></div>
  <div class="project-auth" id="project-auth" hidden>
    <form id="project-login-form">
      <div class="project-field"><label for="project-admin-email">ADMIN EMAIL</label><input id="project-admin-email" type="email" autocomplete="username" required /></div>
      <div class="project-field"><label for="project-admin-password">PASSWORD</label><input id="project-admin-password" type="password" autocomplete="current-password" required /></div>
      <button class="button primary" type="submit">Sign in ↗</button>
    </form>
  </div>
  <form class="project-form" id="project-upload-form" hidden>
    <div class="project-field"><label for="project-name">APP NAME *</label><input id="project-name" name="name" maxlength="100" required /></div>
    <div class="project-field"><label for="project-logo">APP LOGO (OPTIONAL)</label><input id="project-logo" name="logo" type="file" accept="image/*" /></div>
    <div class="project-field full"><label for="project-description">DESCRIPTION (OPTIONAL)</label><textarea id="project-description" name="description" maxlength="1500"></textarea></div>
    <div class="project-field"><label for="project-services">SERVICES USED (OPTIONAL)</label><input id="project-services" name="services" placeholder="Flutter, Firebase, REST API" maxlength="300" /></div>
    <div class="project-field"><label for="project-link">PROJECT LINK (OPTIONAL)</label><input id="project-link" name="link" type="url" placeholder="https://…" /></div>
    <button class="button primary" type="submit">Publish project ↗</button>
  </form>
`;
projectSection.append(projectAdmin);
projectAdmin.querySelector(".project-gallery-list").append(projectGallery);

const status = projectAdmin.querySelector("#project-status");
const loginPanel = projectAdmin.querySelector("#project-auth");
const loginToggle = projectAdmin.querySelector("#project-auth-toggle");
const logoutButton = projectAdmin.querySelector("#project-sign-out");
const loginForm = projectAdmin.querySelector("#project-login-form");
const uploadForm = projectAdmin.querySelector("#project-upload-form");

function reportError(message, error) {
  console.error(message, error);
  status.textContent = `${message} ${error.message || "Please try again."}`;
}

function authErrorMessage(error) {
  const messages = {
    "auth/invalid-credential": "Email or password is incorrect.",
    "auth/invalid-login-credentials": "Email or password is incorrect.",
    "auth/user-not-found": "Email or password is incorrect.",
    "auth/wrong-password": "Email or password is incorrect.",
    "auth/too-many-requests": "Too many attempts. Try again later.",
    "auth/invalid-email": "Enter a valid admin email address.",
    "auth/network-request-failed": "Network error. Check your internet connection."
  };
  return messages[error.code] || "Could not sign in. Check Firebase Authentication setup.";
}

function validProjectUrl(value) {
  if (!value) return "";
  const parsed = new URL(value);
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new Error("Project links must start with http:// or https://.");
  }
  return parsed.href;
}

function renderProjects(projects, isAdmin) {
  projectGallery.replaceChildren();
  if (projects.length === 0) {
    const emptyMessage = document.createElement("p");
    emptyMessage.className = "project-status";
    emptyMessage.textContent = "No projects have been added yet.";
    projectGallery.append(emptyMessage);
    return;
  }

  for (const project of projects) {
    const card = document.createElement("article");
    card.className = "project-card";

    if (project.logoUrl) {
      const logo = document.createElement("img");
      logo.className = "project-logo";
      logo.src = project.logoUrl;
      logo.alt = `${project.name} logo`;
      logo.loading = "lazy";
      card.append(logo);
    } else {
      const logo = document.createElement("div");
      logo.className = "project-logo";
      logo.setAttribute("aria-hidden", "true");
      logo.textContent = project.name.slice(0, 1).toUpperCase();
      card.append(logo);
    }

    const body = document.createElement("div");
    body.className = "project-card-body";
    const title = document.createElement("h3");
    title.textContent = project.name;
    body.append(title);

    if (project.description) {
      const description = document.createElement("p");
      description.textContent = project.description;
      body.append(description);
    }

    if (project.services.length) {
      const services = document.createElement("div");
      services.className = "project-services";
      for (const service of project.services) {
        const tag = document.createElement("span");
        tag.textContent = service;
        services.append(tag);
      }
      body.append(services);
    }

    const actions = document.createElement("div");
    actions.className = "project-card-actions";
    if (project.link) {
      const link = document.createElement("a");
      link.href = project.link;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = "VIEW PROJECT ↗";
      actions.append(link);
    }
    if (isAdmin) {
      const remove = document.createElement("button");
      remove.type = "button";
      remove.textContent = "Remove";
      remove.addEventListener("click", () => removeProject(project));
      actions.append(remove);
    }
    body.append(actions);
    card.append(body);
    projectGallery.append(card);
  }
}

async function removeProject(project) {
  if (!window.confirm(`Remove "${project.name}" from the public portfolio?`)) return;
  let removed = false;
  try {
    await deleteDoc(doc(database, "projects", project.id));
    removed = true;
    if (project.logoPath) {
      await deleteObject(ref(storage, project.logoPath));
    }
    status.textContent = `${project.name} was removed.`;
  } catch (error) {
    reportError(
      removed
        ? "The project was removed, but its logo could not be deleted."
        : "Could not remove the project.",
      error
    );
  }
}

if (
  Object.values(firebaseConfig).some(value => !value || value.startsWith("YOUR_")) ||
  !adminEmail ||
  adminEmail.startsWith("YOUR_")
) {
  status.textContent = "Project gallery is not connected yet. Follow the Firebase setup steps in README.md.";
  loginToggle.disabled = true;
} else {
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const database = getFirestore(app);
  const storage = getStorage(app);
  let projects = [];
  let isAdmin = false;
  let isSignedIn = false;

  onSnapshot(
    query(collection(database, "projects"), orderBy("createdAt", "desc")),
    snapshot => {
      projects = snapshot.docs.map(projectDoc => {
        const data = projectDoc.data();
        let link = "";
        try {
          link = validProjectUrl(data.link || "");
        } catch (error) {
          console.error(`Ignoring invalid project URL for ${projectDoc.id}.`, error);
        }
        return {
          id: projectDoc.id,
          name: data.name || "Untitled app",
          logoUrl: data.logoUrl || "",
          logoPath: data.logoPath || "",
          description: data.description || "",
          services: Array.isArray(data.services) ? data.services : [],
          link
        };
      });
      if (projects.length === 0) {
        status.textContent = isAdmin
          ? "Signed in as admin. Add your first project below."
          : isSignedIn
            ? "This account is not authorized to manage portfolio projects."
            : "No projects have been added yet.";
      } else {
        status.textContent = isAdmin
          ? "Signed in as admin. New projects will appear publicly after publishing."
          : isSignedIn
            ? "This account is not authorized to manage portfolio projects."
            : "";
      }
      renderProjects(projects, isAdmin);
    },
    error => reportError("Could not load projects.", error)
  );

  onAuthStateChanged(auth, user => {
    isSignedIn = Boolean(user);
    isAdmin = Boolean(user?.email && user.email.toLowerCase() === adminEmail.toLowerCase());
    loginToggle.hidden = Boolean(user);
    logoutButton.hidden = !user;
    loginPanel.hidden = true;
    uploadForm.hidden = !isAdmin;
    if (user && !isAdmin) {
      status.textContent = "This account is not authorized to manage portfolio projects.";
    } else if (isAdmin) {
      status.textContent = "Signed in as admin. New projects will appear publicly after publishing.";
    }
    renderProjects(projects, isAdmin);
  }, error => reportError("Could not check the sign-in status.", error));

  loginToggle.addEventListener("click", () => {
    loginPanel.hidden = !loginPanel.hidden;
  });

  loginForm.addEventListener("submit", async event => {
    event.preventDefault();
    const email = projectAdmin.querySelector("#project-admin-email").value.trim();
    const password = projectAdmin.querySelector("#project-admin-password").value;

    if (email.toLowerCase() !== adminEmail.toLowerCase()) {
      status.textContent = "Only the configured admin email can sign in here.";
      return;
    }

    status.textContent = "Signing in…";
    try {
      await signInWithEmailAndPassword(auth, email, password);
      loginForm.reset();
    } catch (error) {
      console.error("Could not sign in.", error);
      status.textContent = authErrorMessage(error);
    }
  });

  logoutButton.addEventListener("click", async () => {
    try {
      await signOut(auth);
      status.textContent = "Signed out.";
    } catch (error) {
      reportError("Could not sign out.", error);
    }
  });

  uploadForm.addEventListener("submit", async event => {
    event.preventDefault();
    if (!isAdmin) {
      status.textContent = "Sign in with the configured admin account to publish projects.";
      return;
    }

    const formData = new FormData(uploadForm);
    const name = String(formData.get("name") || "").trim();
    const description = String(formData.get("description") || "").trim();
    const services = String(formData.get("services") || "")
      .split(",")
      .map(service => service.trim())
      .filter(Boolean);
    const linkValue = String(formData.get("link") || "").trim();
    const logo = formData.get("logo");
    if (logo instanceof File && logo.size > 5 * 1024 * 1024) {
      status.textContent = "Logo images must be 5 MB or smaller.";
      return;
    }
    if (logo instanceof File && logo.size && !logo.type.startsWith("image/")) {
      status.textContent = "The logo must be an image file.";
      return;
    }

    let link;
    try {
      link = validProjectUrl(linkValue);
    } catch (error) {
      status.textContent = error.message;
      return;
    }

    status.textContent = "Publishing project…";
    try {
      let logoUrl = "";
      let logoPath = "";
      if (logo instanceof File && logo.size) {
        const safeName = logo.name.replace(/[^a-zA-Z0-9._-]/g, "-");
        logoPath = `projects/${auth.currentUser.uid}/${Date.now()}-${safeName}`;
        const logoRef = ref(storage, logoPath);
        await uploadBytes(logoRef, logo, { contentType: logo.type });
        logoUrl = await getDownloadURL(logoRef);
      }
      await addDoc(collection(database, "projects"), {
        name,
        description,
        services,
        link,
        logoUrl,
        logoPath,
        createdAt: serverTimestamp()
      });
      uploadForm.reset();
      status.textContent = `${name} is now visible in the public project list.`;
    } catch (error) {
      reportError("Could not publish the project.", error);
    }
  });
}
