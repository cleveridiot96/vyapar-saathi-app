# How to Commit and Push Your Code to GitHub

This guide provides the basic steps to save your work to a Git repository like GitHub from your command line.

**Prerequisite:** You must have Git installed on your computer and have a repository (e.g., on GitHub) ready to push to.

---

## Step 1: Open Your Terminal

Open a command line or terminal on your computer. Make sure you are in the root directory of this project.

## Step 2: Stage Your Changes

This command gathers all the new and modified files, preparing them to be saved. The `.` stands for "all files in the current directory".

```bash
git add .
```

## Step 3: Commit Your Changes

This command saves your staged files as a new version. The `-m` flag allows you to write a short "commit message" describing what you did.

Replace `"Your descriptive message here"` with a summary of the changes you made (e.g., "Fix loading bugs on dashboard").

```bash
git commit -m "Your descriptive message here"
```

**Example:**
```bash
git commit -m "Fix infinite loading state on sales and purchases pages"
```

## Step 4: (First Time Only) Link Your Local Project to a GitHub Repository

If you haven't connected this project to a GitHub repository yet, you need to do this once.

First, copy the URL of your repository from GitHub. It will look something like `https://github.com/your-username/your-repository-name.git`.

Then, run these two commands:

```bash
# Sets the name of your main branch to "main" (a modern standard)
git branch -M main

# Links your local project to the remote GitHub repository
git remote add origin https://github.com/your-username/your-repository-name.git
```

## Step 5: Push Your Changes to GitHub

This command uploads your committed changes from your computer to the GitHub repository.

```bash
git push -u origin main
```

The `-u origin main` part sets it up so that in the future, you can simply run `git push`.

---

## Summary for Future Commits

After the first setup, your workflow will just be these three commands:

1.  `git add .`
2.  `git commit -m "A new message about my new changes"`
3.  `git push`

That's it! Your code is now safely backed up on GitHub.