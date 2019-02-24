set -e
rm -rf gh-pages
mkdir gh-pages
cd gh-pages
git clone https://github.com/SAP/chevrotain.git . --depth 1
git checkout gh-pages

node ../update-api-docs.js

git add -A
git push

# cleanup
cd ..
rm -rf gh-pages

