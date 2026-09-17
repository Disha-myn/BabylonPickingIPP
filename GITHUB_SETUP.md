# Publish to GitHub (for InfoSec review)

Git is not required on your PC if you use **GitHub in the browser**.

## Step 1 — Create the repo

1. Open https://github.com (or your company GitHub Enterprise URL)
2. **New repository**
3. Name: `babylon-picking-ipp`
4. Visibility: **Private** (recommended for internal tools)
5. Do **not** add README/license (you already have files)
6. Create repository

## Step 2 — Upload the project

1. On the empty repo page, click **uploading an existing file**
2. Drag the entire **`babylon_picking_app`** folder contents (or zip and upload)
3. Commit message: `Initial commit — Picking IPP Android app for InfoSec review`
4. **Commit changes**

Optional: also upload from parent folder:
- `XYZ_PICKING_IPP_COUNTER_MOBILE.txt` (master script)

## Step 3 — Copy the repo URL

Your link will look like:

```
https://github.com/YOUR_USERNAME/babylon-picking-ipp
```

or (company):

```
https://github.com/myntra/babylon-picking-ipp
```

## Step 4 — Update InfoSec email

In `INFOSEC_APPROVAL_REQUEST.txt`, replace:

```
https://github.com/[YOUR_ORG_OR_USERNAME]/babylon-picking-ipp
```

with your real URL.

## Step 5 — Grant InfoSec access

Repo **Settings → Collaborators** (or internal access group) → add InfoSec team with **Read** access.

---

## Alternative — GitHub Desktop

1. Install GitHub Desktop
2. File → Add local repository → `babylon_picking_app`
3. Publish repository → Private
4. Copy the URL into the InfoSec request
