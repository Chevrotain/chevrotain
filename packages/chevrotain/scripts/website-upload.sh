set -e
cd dev
rm -rf gh-pages
mkdir gh-pages
cd gh-pages
git clone https://github.com/SAP/chevrotain.git .
git checkout gh-pages
rm -rf docs
## But what about the API docs???
## see: https://github.com/SAP/chevrotain/blob/gh-pages/scripts/upload_docs.js
cp -r ../docs/.vuepress/dist/ docs
git add -A
git commit -m 'Update Website'
# how to push from circle-ci
git push
