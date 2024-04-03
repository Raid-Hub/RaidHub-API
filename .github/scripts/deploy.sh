git fetch
git stash
git reset --hard origin/$1 

bun prisma generate
bun compile $2

sudo systemctl restart $2

if [[ ! -z $3 ]]  ; then 
    git checkout - 
    git stash apply
fi