mkdir data
echo 'mongod --bind_ip=$IP --dbpath=data --nojournal --rest "$@"' > mongod
chmod a+x mongod
git remote add origin https://github.com/quarbby/data-sandbox
git pull origin master
npm install
cd public
bower install
cd ..
./mongod
npm start