##smurf

![image](smurf.png)

Will require you to add a config file with GOOGLE API KEY. 

To get the lastest working example:
```
git checkout example
npm i
npm run dev
```

Contributing directions listed below.  The point of these steps is to maintain a clean commit history. This is accomplished by removing redundant "merge commits", ensuring fast-forward merges always occur, and squashing intermediate feature branch commits so the official develop history is more concise. A clean history makes rolling back changes and pinpointing bugs in commits much easier.

------------------------------

## TL;DR

- Working locally:
```
  git checkout develop
  git pull origin develop
  git checkout -b my_branch_name
// do your work and commit files
// if two commits squash down to 1
  git rebase -i HEAD~2
// place `f` at message you wish to squash
```
- Before pushing up to GH:
```
  git pull --rebase origin develop
// fix merge conflicts if they exist
  git push origin my_branch_name
// possibly use 'git push origin my_branch_name --force'
// with caution if branch already exists on remote

```
- Merging commit (DO NOT USE GITHUB MERGE PR BUTTON see below for more)
```
  git checkout -b brach_to_merge origin/my_branch_name 
  git pull --rebase origin develop
  git push --force  // careful if others have this branch checked out
  git checkout develop
  git pull origin develop
  git merge branch_to_merge
  git push origin develop
//verify PR is closed
```
------------------------------

Check out this link for more on the Git workflow:  
https://www.atlassian.com/git/tutorials/comparing-workflows/gitflow-workflow

## Getting started 

```
 git clone https://github.com/Staance/Android.git
 cd Android
 // open via Android Studio 
```

We will be working off of the `develop` branch. These steps assume the remote `origin` is configured to `https://github.com/Staance/Android.git`.
Run `git remote -v` to see all of your remotes. [Click here for more help with remote configuring](https://help.github.com/articles/adding-a-remote/)

## Feature Branches

- Make sure you are up to date with the current repo. From the `develop` branch run:

```
    git pull origin develop
```
**Note the command above is shorthand: `git pull` = `git fetch` + `git merge`**

- Checkout/create a new feature branch

```
    git checkout -b your_branch_name
```

- Make your changes. When you are ready to save and commit your changes:

```
    git add .
    // you can specify which files to commit here
    git commit -m 'your commit message'
```

**note: each new feature should only have a single commit. See combining commits below.**

## Combining commits 

- If you have several commits run the following commands:

```
    git log 
```
- count the `n` number of commits you have made and want to combine

```
    git rebase -i HEAD~n 
```
**note: `n` above is the number of commits you've made**

This will take you to an interactive rebasing screen where you can select which commit messages you want to discard. Navigate to the commit messages using the cursor, delete the `pick` text and replace with `f` to use the commit, but discard the commit message (leave one `pick` commit). A list of other helpful commands are also presented. When you are done use `Control + X`, then `Y` and `enter` to exit that screen and save the changes. If you run `git log` you should see the updated messages.

- Once the commits are combined push them up to the remote:

```
    git push origin your_branch_name
    // You may wnat to rebase first! see below
```
*Note: Since you have changed the history with the rebase, you may need to use the force flag if you're pushing to an existing remote branch: `git push origin your_branch_name --force` ALWAYS DO THIS WITH CAUTION. Keep in mind `git push --force` is only good for a feature branch that nobody else is working on. Alternately, you can create a new "_rebase" branch before squashing and rebasing with develop.*

## Rebasing 

It is always a good idea to rebase before pushing your changes up to github (or whenever new code is commited to develop). Rebasing will take your commit(s) and play them on top of the current history. 

Simply run:

```
    git pull --rebase origin develop
```    

**Note that above is just a shorthand: `git pull --rebase` = `git fetch` + `git rebase`** 

If there is a merge conflict (you and someone else edited the same line in a file) a merge conflict message will appear and rebasing will stop. Navigate to the file(s) listed in the message and resolve the issues and then run 
```
    git add .
    git rebase --continue
```
Repeat this until all merge conflicts are resolved or you decide to abort (`git rebase --abort`)

## Merging a pull request

Merging PR's from the command line will ensure a clean and concise commit history without extra merge commits. For more on why we **DO NOT** use GitHub's green commit button for mergin commits see the article on merging PR's here:  https://github.com/wp-e-commerce/wp-e-commerce/wiki/Merging-Pull-Requests

From the command line, check out the branch you wish to merge and pull in the latest changes from develop like so:
```
    git checkout -b brach_to_merge origin/your_branch_name
    git pull --rebase origin develop
```
NOTE: If it is your own branch you can simply run this command instead:
```
   git checkout your_branch_name
   git pull --rebase origin develop
   git push --force  // careful if others have this branch checked out

```

- This will replay your commit(s) on top of the current commit history on develop. For more about rebasing see the blurb above.

- Next checkout `develop` and pull in the latest changes
```
    git checkout develop
    git pull origin develop
```
- Next merge your banch in 
```
    git merge your_branch_name
```

  - next push your changes up to develop
```
    git push origin develop
```
 Your commit should be pushed up! You can now safely close the PR and reference the commit # in the message for tracking. 
