echo "uploading new api docs website"
set -e
rm -rf gh-pages
mkdir gh-pages
cd gh-pages
git clone https://github.com/chevrotain/chevrotain.git .

echo "checkout gh-pages"
git checkout gh-pages

node ../scripts/update-api-docs.js

git add -A
git commit -m "update api website"
git push

# cleanup
cd ..
rm -rf gh-pages

