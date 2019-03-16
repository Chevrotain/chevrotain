set -e
rm -rf gh-pages
mkdir gh-pages
cd gh-pages

git clone https://github.com/SAP/chevrotain.git .
git checkout gh-pages

# update contents
rm -rf docs
cp -r ../docs/.vuepress/dist/ docs

git add -A
git commit -m 'Update Website'
git push

# cleanup
cd ..
rm -rf gh-pages