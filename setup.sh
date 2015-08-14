mkdir data
echo 'mongod --bind_ip=$IP --dbpath=data --nojournal --rest "$@"' > mongod
chmod a+x mongod
git remote add origin https://github.com/kahkhang/hyde.git
git pull origin master
npm install
cd public
bower install
cd ..
./mongod
npm start

# If needed, run <url>/api/StoreLayers to populate data
# Example: hackathon-kahkhang.c9.io/api/StoreLayers